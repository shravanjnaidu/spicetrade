# ── Gevent monkey patching ── must be the very first code executed ───────────
try:
    from gevent import monkey; monkey.patch_all()
except ImportError:
    pass  # gevent not installed; falls back to standard threaded mode
# ─────────────────────────────────────────────────────────────────────────────

import os
import io
import json
import queue
import threading
import uuid
import secrets
from functools import wraps
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context, render_template, make_response, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import resend
import boto3
try:
    import jwt as pyjwt
    _JWT_AVAILABLE = True
except ImportError:
    _JWT_AVAILABLE = False


BASE_DIR = Path(__file__).resolve().parent

# Load PostgreSQL credentials
with open(BASE_DIR / 'creds.json', 'r') as f:
    DB_CONFIG = json.load(f)

resend.api_key = DB_CONFIG.get('resendapikey', '')
APP_URL = os.environ.get('APP_URL', 'https://bigspice.in')

# ── JWT configuration ─────────────────────────────────────────────────────────
# Secret is loaded from creds.json (key: "jwt_secret") or the JWT_SECRET env var.
# On first run a random value is generated; to persist tokens across restarts,
# set a fixed value in creds.json.
JWT_SECRET = DB_CONFIG.get('jwt_secret') or os.environ.get('JWT_SECRET') or secrets.token_hex(32)
JWT_ALGORITHM = 'HS256'
JWT_EXPIRES_DAYS = 90  # tokens valid for 90 days


def _generate_token(user_id: int, role: str) -> str:
    """Return a signed JWT for the given user."""
    if not _JWT_AVAILABLE:
        return ''
    payload = {
        'sub': user_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=JWT_EXPIRES_DAYS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_auth(f):
    """Decorator: requires a valid Bearer JWT in the Authorization header.
    Sets g.user_id and g.user_role if the token is valid."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'authentication required'}), 401
        token = auth_header[7:]
        if not _JWT_AVAILABLE:
            return jsonify({'error': 'JWT not configured on server'}), 500
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            g.user_id = payload['sub']
            g.user_role = payload.get('role', 'buyer')
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'token expired'}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({'error': 'invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

# ── S3 config ──────────────────────────────────────────────────────────────────
S3_BUCKET = DB_CONFIG.get('s3_bucket_name', '')
S3_REGION = DB_CONFIG.get('aws_region', 'ap-south-2')

DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

# ── Firebase / FCM ─────────────────────────────────────────────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials as fb_creds, messaging as fb_messaging
    _fb_key = BASE_DIR / DB_CONFIG.get('firebase_service_account', 'firebase-service-account.json')
    if _fb_key.exists():
        firebase_admin.initialize_app(fb_creds.Certificate(str(_fb_key)))
        _FCM_OK = True
    else:
        _FCM_OK = False
        print('[FCM] firebase-service-account.json not found — push notifications disabled')
except Exception as _fcm_err:
    _FCM_OK = False
    print(f'[FCM] Not available: {_fcm_err}')


def get_db():
    conn = psycopg2.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        dbname=DB_CONFIG['dbname'],
        user=DB_CONFIG['username'],
        password=DB_CONFIG['password']
    )
    return conn


def dict_cursor(conn):
    return conn.cursor(cursor_factory=RealDictCursor)


def init_db():
    conn = get_db()
    cur = conn.cursor()
    
    # Create users table
    cur.execute('''CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        role TEXT,
        storeName TEXT,
        businessType TEXT,
        categories TEXT,
        taxNumber TEXT,
        address TEXT,
        website TEXT,
        shippingLocations TEXT,
        logo_path TEXT,
        uniqueId TEXT,
        location TEXT,
        profilePicture TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    # Add store_views column if it doesn't exist (safe migration)
    cur.execute('''ALTER TABLE users ADD COLUMN IF NOT EXISTS store_views INTEGER DEFAULT 0''')
    
    # Create ads table
    cur.execute('''CREATE TABLE IF NOT EXISTS ads (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        userId INTEGER,
        category TEXT,
        tags TEXT,
        price REAL,
        unit TEXT,
        minOrder INTEGER,
        stock INTEGER,
        imageUrl TEXT,
        images TEXT,
        verified INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )''')
    
    # Create conversations table
    cur.execute('''CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        buyerId INTEGER,
        sellerId INTEGER,
        listingId INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(buyerId) REFERENCES users(id),
        FOREIGN KEY(sellerId) REFERENCES users(id),
        FOREIGN KEY(listingId) REFERENCES ads(id)
    )''')
    
    # Create messages table
    cur.execute('''CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversationId INTEGER,
        senderId INTEGER,
        message TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversationId) REFERENCES conversations(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
    )''')
    
    # Create wishlist table
    cur.execute('''CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        adId INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(adId) REFERENCES ads(id),
        UNIQUE(userId, adId)
    )''')
    
    # Create reviews table
    cur.execute('''CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        adId INTEGER,
        userId INTEGER,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        reviewText TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(adId) REFERENCES ads(id),
        FOREIGN KEY(userId) REFERENCES users(id),
        UNIQUE(userId, adId)
    )''')

    # Create banner_ads table (paid advertisements shown in homepage carousel)
    cur.execute('''CREATE TABLE IF NOT EXISTS banner_ads (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        imageUrl TEXT NOT NULL,
        targetUrl TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiresAt TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    )''')

    # Create device_tokens table for FCM push notifications
    cur.execute('''CREATE TABLE IF NOT EXISTS device_tokens (
        user_id INTEGER PRIMARY KEY,
        fcm_token TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    conn.commit()
    
    # Add extra store-profile columns if they don't already exist
    extra_cols = [
        ('tagline',           'TEXT'),
        ('storedescription',  'TEXT'),
        ('ownermessage',      'TEXT'),
        ('yearestablished',   'TEXT'),
        ('employeecount',     'TEXT'),
        ('annualturnover',    'TEXT'),
        ('paymentmodes',      'TEXT'),
        ('exportmarkets',     'TEXT'),
        ('certifications',    'TEXT'),
        ('whyus',             'TEXT'),
    ]
    for col, col_type in extra_cols:
        try:
            cur.execute(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}')
        except Exception:
            pass
    conn.commit()

    # Add listingType to ads table if it doesn't already exist
    try:
        cur.execute("ALTER TABLE ads ADD COLUMN IF NOT EXISTS listingType TEXT")
    except Exception:
        pass
    conn.commit()

    # Backfill listingType='requirement' for legacy rows where title signals a requirement
    try:
        cur.execute("""
            UPDATE ads SET listingType = 'requirement'
            WHERE listingtype IS NULL
              AND price IS NULL
              AND LOWER(title) LIKE 'looking for%'
        """)
    except Exception:
        pass
    conn.commit()

    # Add extra columns to banner_ads if they don't already exist
    banner_extra_cols = [
        ('contactName',   'TEXT'),
        ('contactNumber', 'TEXT'),
        ('industry',      'TEXT'),
        ('adAddress',     'TEXT'),
        ('notes',         'TEXT'),
    ]
    for col, col_type in banner_extra_cols:
        try:
            cur.execute(f'ALTER TABLE banner_ads ADD COLUMN IF NOT EXISTS {col} {col_type}')
        except Exception:
            pass
    conn.commit()

    # Generate unique IDs for existing users without one
    import uuid
    cur.execute("SELECT id FROM users WHERE uniqueId IS NULL OR uniqueId = ''")
    users_without_id = cur.fetchall()
    for row in users_without_id:
        unique_id = 'ST' + str(uuid.uuid4())[:8].upper()
        cur.execute("UPDATE users SET uniqueId = %s WHERE id = %s", (unique_id, row['id']))
    conn.commit()
    
    cur.close()
    conn.close()


app = Flask(
    __name__,
    static_folder=str(BASE_DIR / 'public'),
    static_url_path='',
    template_folder=str(BASE_DIR / 'templates'),
)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB upload limit
CORS(app)

# ── Device-detection middleware ───────────────────────────────────────────────
from middleware.device_middleware import init_device_middleware
init_device_middleware(app)
# ─────────────────────────────────────────────────────────────────────────────

# ── Image optimisation helper ─────────────────────────────────────────────────
try:
    from PIL import Image as PILImage
    _PILLOW_OK = True
except ImportError:
    _PILLOW_OK = False

# Product listing images: resize to max 1200px wide, quality 82
_PRODUCT_MAX_PX = 1200
# Store logos / avatars: resize to max 400px, quality 85
_AVATAR_MAX_PX = 400

def optimise_and_save(stream, dest_path: Path, max_px: int = _PRODUCT_MAX_PX, quality: int = 82):
    """
    Open an uploaded image stream, resize (keeping aspect ratio) so the longer
    edge is ≤ max_px, and save as WebP.  Falls back to raw save if Pillow is
    not available.
    """
    if not _PILLOW_OK:
        with open(str(dest_path), 'wb') as f:
            f.write(stream.read())
        return
    try:
        img = PILImage.open(stream)
        # Convert palette / RGBA to RGB for WebP compatibility
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')
        # Resize only if larger than limit
        w, h = img.size
        if max(w, h) > max_px:
            ratio = max_px / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), PILImage.LANCZOS)
        img.save(str(dest_path), 'WEBP', quality=quality, method=4)
    except Exception as e:
        print(f'optimise_and_save warning ({dest_path.name}): {e} — saving raw')
        stream.seek(0)
        with open(str(dest_path), 'wb') as f:
            f.write(stream.read())
# ─────────────────────────────────────────────────────────────────────────────

# ── S3 image helpers ───────────────────────────────────────────────────────────

def _get_s3():
    """Return a boto3 S3 client.
    - Locally: uses aws_access_key_id / aws_secret_access_key from creds.json.
    - On EC2: keys are absent so boto3 falls through to the IAM instance role.
    """
    ak = DB_CONFIG.get('aws_access_key_id', '').strip()
    sk = DB_CONFIG.get('aws_secret_access_key', '').strip()
    if ak and sk:
        return boto3.client('s3', region_name=S3_REGION,
                            aws_access_key_id=ak, aws_secret_access_key=sk)
    return boto3.client('s3', region_name=S3_REGION)


def _upload_image_to_s3(stream, key: str,
                         max_px: int = _PRODUCT_MAX_PX, quality: int = 82) -> str:
    """Optimise an uploaded image and upload it to S3.  Returns the public URL."""
    buf = io.BytesIO()
    if _PILLOW_OK:
        try:
            img = PILImage.open(stream)
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            w, h = img.size
            if max(w, h) > max_px:
                ratio = max_px / max(w, h)
                img = img.resize((int(w * ratio), int(h * ratio)), PILImage.LANCZOS)
            img.save(buf, 'WEBP', quality=quality, method=4)
            buf.seek(0)
        except Exception as exc:
            print(f'[s3] optimise warning: {exc} — uploading raw')
            stream.seek(0)
            buf = stream
    else:
        buf = stream
    try:
        _get_s3().upload_fileobj(buf, S3_BUCKET, key,
                                  ExtraArgs={'ContentType': 'image/webp', 'ACL': 'public-read'})
    except Exception:
        # Bucket may block public ACLs; fall back to upload without explicit ACL
        buf.seek(0) if hasattr(buf, 'seek') else None
        _get_s3().upload_fileobj(buf, S3_BUCKET, key, ExtraArgs={'ContentType': 'image/webp'})
    return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"

# ─────────────────────────────────────────────────────────────────────────────

# ── Requirement notification email ───────────────────────────────────────────

def _requirement_email_html(buyer_name: str, title: str, description: str,
                             category: str, listing_url: str) -> str:
    """Build a professional HTML email body for a new buyer requirement."""
    # Truncate description to ~300 chars for the synopsis
    synopsis = (description[:300] + '…') if len(description) > 300 else description
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Buyer Requirement — BigSpice</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#b5451b 0%,#e07b39 100%);
                        padding:28px 40px 24px;text-align:center;">
              <!-- Bubble icon + wordmark side-by-side -->
              <table cellpadding="0" cellspacing="0" border="0"
                     style="margin:0 auto 10px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="{APP_URL}/logos/bigspicebubble.png"
                         alt="BigSpice icon"
                         width="52" height="52"
                         style="display:block;border-radius:50%;
                                border:2px solid rgba(255,255,255,0.35);" />
                  </td>
                  <td style="vertical-align:middle;">
                    <img src="{APP_URL}/logos/bigspicelogo.png"
                         alt="BigSpice"
                         height="36"
                         style="display:block;max-width:160px;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:14px;
                         letter-spacing:0.5px;">B2B Spice &amp; Food Trade Platform</p>
            </td>
          </tr>

          <!-- Tag line banner -->
          <tr>
            <td style="background:#fff8f2;padding:14px 40px;border-bottom:1px solid #f0e6da;">
              <p style="margin:0;font-size:13px;color:#b5451b;font-weight:600;
                         text-transform:uppercase;letter-spacing:0.8px;">New Buyer Requirement</p>
            </td>
          </tr>

          <!-- Main body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi there,
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                A buyer has just posted a new sourcing requirement that matches your
                listed category. Here's a quick overview:
              </p>

              <!-- Requirement card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fff8f2;border:1px solid #f0e6da;
                             border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <!-- Category badge -->
                    <p style="margin:0 0 12px;">
                      <span style="display:inline-block;background:#b5451b;color:#ffffff;
                                   font-size:11px;font-weight:700;letter-spacing:0.8px;
                                   text-transform:uppercase;padding:4px 10px;
                                   border-radius:4px;">{category}</span>
                    </p>
                    <!-- Title -->
                    <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;font-weight:700;
                                line-height:1.3;">{title}</h2>
                    <!-- Synopsis -->
                    <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.7;
                               border-left:3px solid #e07b39;padding-left:14px;">
                      {synopsis}
                    </p>
                    <!-- Buyer -->
                    <p style="margin:0;font-size:13px;color:#888888;">
                      Posted by <strong style="color:#333333;">{buyer_name}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{listing_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#b5451b,#e07b39);
                               color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;
                               padding:14px 40px;border-radius:50px;
                               box-shadow:0 4px 14px rgba(181,69,27,0.35);
                               letter-spacing:0.3px;">
                      View This Requirement &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;color:#888888;line-height:1.6;">
                If the button above doesn't work, copy and paste this link into your
                browser:<br />
                <a href="{listing_url}" style="color:#b5451b;word-break:break-all;">{listing_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf5ef;padding:24px 40px;border-top:1px solid #f0e6da;
                        text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#aaaaaa;">
                You're receiving this because you have listed products/services in
                the <strong>{category}</strong> category on BigSpice.
              </p>
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                &copy; 2026 BigSpice &mdash;
                <a href="{APP_URL}" style="color:#b5451b;text-decoration:none;">bigspice.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# ── FCM helpers ───────────────────────────────────────────────────────────────

def _send_fcm(token: str, title: str, body: str, data: dict = None):
    """Send a single FCM push notification. Silently ignores errors."""
    if not _FCM_OK or not token:
        return
    try:
        fb_messaging.send(fb_messaging.Message(
            notification=fb_messaging.Notification(title=title, body=body),
            data={str(k): str(v) for k, v in (data or {}).items()},
            token=token,
        ))
    except Exception as e:
        print(f'[FCM] send error: {e}')


def _get_fcm_tokens(user_ids: list) -> list:
    """Return FCM tokens for the given list of user IDs."""
    if not user_ids or not _FCM_OK:
        return []
    try:
        db = get_db()
        c = dict_cursor(db)
        c.execute('SELECT fcm_token FROM device_tokens WHERE user_id = ANY(%s)', (user_ids,))
        rows = c.fetchall()
        db.close()
        return [r['fcm_token'] for r in rows if r['fcm_token']]
    except Exception as e:
        print(f'[FCM] _get_fcm_tokens error: {e}')
        return []


def notify_sellers_of_requirement(ad_id: int, title: str, description: str,
                                   category: str, buyer_name: str) -> None:
    """Find sellers with matching category listings and email them.
    Runs in a background thread — must not raise."""
    try:
        listing_url = f"{APP_URL}/listing.html?id={ad_id}"
        html = _requirement_email_html(buyer_name, title, description, category, listing_url)

        db = get_db()
        cur = db.cursor(cursor_factory=RealDictCursor)
        # Find sellers who have at least one non-requirement listing in the same category
        cur.execute("""
            SELECT DISTINCT u.id, u.email, u.name
            FROM users u
            JOIN ads a ON a.userid = u.id
            WHERE u.role = 'seller'
              AND u.email IS NOT NULL
              AND a.category = %s
              AND (a.listingtype IS NULL OR a.listingtype != 'requirement')
        """, (category,))
        sellers = cur.fetchall()
        cur.close()
        db.close()

        if not sellers:
            print(f'[email] No sellers found for category "{category}" — skipping.')
            return

        for seller in sellers:
            try:
                resend.Emails.send({
                    'from': 'BigSpice <onboarding@resend.dev>',
                    'to': [seller['email']],
                    'subject': f'New Buyer Requirement: {title}',
                    'html': html,
                })
                print(f'[email] Sent requirement notification to {seller["email"]}')
            except Exception as exc:
                print(f'[email] Failed to send to {seller["email"]}: {exc}')

        # Push FCM notifications to all matching sellers
        seller_ids = [s['id'] for s in sellers]
        for tok in _get_fcm_tokens(seller_ids):
            _send_fcm(tok, '🌶 New Requirement',
                      f'{category}: {title[:80]}',
                      {'type': 'new_requirement', 'adId': str(ad_id)})
    except Exception as exc:
        print(f'[email] notify_sellers_of_requirement error: {exc}')

# ─────────────────────────────────────────────────────────────────────────────

# Initialize DB immediately so we don't rely on server hooks that may differ across environments
init_db()


def seed_default_banners():
    """Insert 4 default banner ads if the table is empty."""
    try:
        db = get_db()
        cur = dict_cursor(db)
        cur.execute("SELECT COUNT(*) AS cnt FROM banner_ads WHERE status = 'active'")
        row = cur.fetchone()
        if row and (row.get('cnt') or 0) > 0:
            cur.close()
            db.close()
            return  # banners already exist
        defaults = [
            {
                'title': 'Premium Spices & Herbs',
                'description': 'Source verified spice suppliers in bulk. Best prices direct from farms.',
                'imageUrl': '/banners/banner-spices.svg',
                'targetUrl': '/all-listings.html?category=Spices%20%26%20Herbs',
            },
            {
                'title': 'Quality Pulses & Legumes',
                'description': 'Certified quality · Direct from farmers · Nationwide delivery.',
                'imageUrl': '/banners/banner-pulses.svg',
                'targetUrl': '/all-listings.html?category=Pulses%20%26%20Legumes',
            },
            {
                'title': 'Premium Tea & Coffee',
                'description': 'Bulk orders from trusted estates. Fine grades for wholesale buyers.',
                'imageUrl': '/banners/banner-tea.svg',
                'targetUrl': '/all-listings.html?category=Tea%20%26%20Coffee',
            },
            {
                'title': 'Nuts & Dry Fruits',
                'description': 'Best grades at wholesale prices. Source directly from processors.',
                'imageUrl': '/banners/banner-nuts.svg',
                'targetUrl': '/all-listings.html?category=Nuts%20%26%20Dry%20Fruits',
            },
        ]
        for b in defaults:
            cur.execute(
                "INSERT INTO banner_ads (title, description, imageUrl, targetUrl, status) "
                "VALUES (%s, %s, %s, %s, 'active')",
                (b['title'], b['description'], b['imageUrl'], b['targetUrl'])
            )
        db.commit()
        cur.close()
        db.close()
        print('[seed] Inserted 4 default banner ads')
    except Exception as e:
        print('[seed] seed_default_banners error:', e)


seed_default_banners()

# ── Redis (optional — required for multi-worker deployments) ─────────────────
# Set REDIS_URL env var in production, e.g. redis://localhost:6379/0
_redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
try:
    import redis as _redis_lib
    _redis_client = _redis_lib.from_url(
        _redis_url, decode_responses=True, socket_connect_timeout=2
    )
    _redis_client.ping()
    USE_REDIS = True
    print('[SSE] Redis connected — multi-worker pub/sub enabled')
except Exception as _redis_err:
    USE_REDIS = False
    _redis_client = None
    print(f'[SSE] Redis unavailable ({_redis_err}) — in-memory pub/sub active (single-worker only)')
# ─────────────────────────────────────────────────────────────────────────────

# ── SSE pub/sub (in-memory fallback when Redis is not available) ──────────────
_sse_subscribers = {}   # {user_id: [queue, ...]}
_sse_lock = threading.Lock()

def _sse_subscribe(user_id):
    q = queue.Queue(maxsize=100)
    with _sse_lock:
        _sse_subscribers.setdefault(user_id, []).append(q)
    return q

def _sse_unsubscribe(user_id, q):
    with _sse_lock:
        subs = _sse_subscribers.get(user_id, [])
        if q in subs:
            subs.remove(q)
        if not subs:
            _sse_subscribers.pop(user_id, None)

def _sse_publish(user_id, event_type, data):
    payload = json.dumps({'type': event_type, 'data': data})
    if USE_REDIS:
        try:
            _redis_client.publish(f'bigspice:user:{user_id}', payload)
        except Exception as e:
            print(f'[SSE] Redis publish error: {e}')
    else:
        event = json.loads(payload)
        with _sse_lock:
            queues = list(_sse_subscribers.get(user_id, []))
        for q in queues:
            try:
                q.put_nowait(event)
            except queue.Full:
                pass
# ─────────────────────────────────────────────────────────────────────────────


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload product/listing images to S3; returns S3 URL(s)."""
    try:
        files = request.files.getlist('file')
        if not files or len(files) == 0:
            return jsonify({'error': 'No files provided'}), 400

        uploaded_urls = []
        for file in files:
            if file.filename == '':
                continue
            stem = Path(secure_filename(file.filename)).stem
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            key = f"uploads/products/{timestamp}_{stem}.webp"
            url = _upload_image_to_s3(file.stream, key)
            uploaded_urls.append(url)

        if len(uploaded_urls) == 0:
            return jsonify({'error': 'No valid files uploaded'}), 400

        if len(uploaded_urls) == 1:
            return jsonify({'success': True, 'url': uploaded_urls[0]})
        return jsonify({'success': True, 'urls': uploaded_urls})
    except Exception as e:
        print('upload_file error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Upload failed'}), 500


@app.route('/api/s3/presign', methods=['POST'])
def s3_presign():
    """Generate a pre-signed PUT URL for direct browser→S3 uploads.

    Request body (JSON):
        folder       – one of: products | avatars | logos | banners
        filename     – original file name (used for extension only)
        content_type – MIME type, e.g. 'image/jpeg'

    Response:
        upload_url  – signed PUT URL (valid 15 min); PUT the raw file bytes here
        public_url  – permanent S3 URL to store in the database
        key         – S3 object key
    """
    data = request.get_json() or {}
    folder = data.get('folder', 'products')
    if folder not in ('products', 'avatars', 'logos', 'banners'):
        folder = 'products'
    original = secure_filename(data.get('filename') or 'upload.bin')
    suffix = Path(original).suffix or '.jpg'
    stem = Path(original).stem
    content_type = data.get('content_type', 'image/jpeg')
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    key = f"uploads/{folder}/{timestamp}_{stem}{suffix}"
    try:
        upload_url = _get_s3().generate_presigned_url(
            'put_object',
            Params={'Bucket': S3_BUCKET, 'Key': key, 'ContentType': content_type},
            ExpiresIn=900,
        )
        public_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"
        return jsonify({'success': True, 'upload_url': upload_url,
                        'public_url': public_url, 'key': key})
    except Exception as e:
        print('s3_presign error:', e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/signup', methods=['POST'])
def signup():
    # Support JSON or multipart/form-data
    if request.content_type and request.content_type.startswith('application/json'):
        data = request.get_json() or {}
        form = data
        files = {}
    else:
        form = request.form or {}
        files = request.files or {}

    name = form.get('name')
    email = form.get('email')
    password = form.get('password')
    phone = form.get('phone')
    role = form.get('role') or 'seller'
    location = form.get('location')
    storeName = form.get('storeName') or form.get('advertiserCompany')  # advertiser uses advertiserCompany
    businessType = form.get('businessType')
    categories = form.get('categories')
    taxNumber = form.get('taxNumber')
    address = form.get('address')
    website = form.get('website')
    # shippingLocations may be submitted as multiple values
    if isinstance(form, dict):
        shipping_list = form.get('shippingLocations')
    else:
        shipping_list = request.form.getlist('shippingLocations')
    if isinstance(shipping_list, list):
        shipping = ','.join(shipping_list)
    else:
        shipping = shipping_list or ''

    if not email or not password:
        return jsonify({'error': 'email and password required'}), 400

    # handle logo upload (for sellers)
    logo_path = None
    logo_file = files.get('logo') if files else None
    if logo_file and getattr(logo_file, 'filename', None):
        stem = Path(secure_filename(logo_file.filename)).stem
        ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        key = f"uploads/logos/{ts}_{stem}.webp"
        logo_path = _upload_image_to_s3(logo_file.stream, key, max_px=_AVATAR_MAX_PX, quality=85)

    # handle profile picture upload (for buyers)
    profile_picture = None
    profile_file = files.get('profilePicture') if files else None
    if profile_file and getattr(profile_file, 'filename', None):
        stem = Path(secure_filename(profile_file.filename)).stem
        ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        key = f"uploads/profiles/profile_{ts}_{stem}.webp"
        profile_picture = _upload_image_to_s3(profile_file.stream, key, max_px=_AVATAR_MAX_PX, quality=85)

    # Generate unique ID
    import uuid
    unique_id = 'ST' + str(uuid.uuid4())[:8].upper()
    
    hashed = generate_password_hash(password)
    try:
        db = get_db()
        cur = dict_cursor(db)
        cur.execute('INSERT INTO users (name, email, password, phone, role, storeName, businessType, categories, taxNumber, address, website, shippingLocations, logo_path, uniqueId, location, profilePicture) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
                    (name, email, hashed, phone, role, storeName, businessType, categories, taxNumber, address, website, shipping, logo_path, unique_id, location, profile_picture))
        user_id = cur.fetchone()['id']
        db.commit()
        
        # Return complete user data
        user_data = {
            'success': True,
            'userId': user_id,
            'id': user_id,
            'name': name,
            'email': email,
            'phone': phone,
            'role': role,
            'storeName': storeName,
            'businessType': businessType,
            'categories': categories,
            'address': address,
            'website': website,
            'logo': logo_path,
            'uniqueId': unique_id,
            'location': location,
            'profilePicture': profile_picture,
            'token': _generate_token(user_id, role),
        }
        db.close()
        return jsonify(user_data)
    except psycopg2.IntegrityError as e:
        return jsonify({'error': 'email already used'}), 409
    except Exception as e:
        print('signup error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'email and password required'}), 400
    try:
        db = get_db()
        cur = dict_cursor(db)
        cur.execute('SELECT id, name, email, password, phone, role, storeName, businessType, categories, address, website, logo_path, uniqueId, location, profilePicture FROM users WHERE email = %s', (email,))
        row = cur.fetchone()
        db.close()
        if not row:
            return jsonify({'error': 'invalid credentials'}), 401
        if not check_password_hash(row['password'], password):
            return jsonify({'error': 'invalid credentials'}), 401
        
        user_data = {
            'success': True,
            'userId': row['id'],
            'id': row['id'],
            'name': row['name'],
            'email': row['email'],
            'phone': row['phone'],
            'role': row['role'] or 'buyer',
            'storeName': row['storename'],
            'businessType': row['businesstype'],
            'categories': row['categories'],
            'address': row['address'],
            'website': row['website'],
            'logo': row['logo_path'],
            'uniqueId': row['uniqueid'],
            'location': row['location'],
            'profilePicture': row['profilepicture'],
            'token': _generate_token(row['id'], row['role'] or 'buyer'),
        }
        return jsonify(user_data)
    except Exception as e:
        print('login error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/device/register', methods=['POST'])
def register_device_token():
    """Store or update a user's FCM device token for push notifications."""
    data = request.get_json() or {}
    user_id = data.get('userId')
    token = data.get('fcmToken')
    if not user_id or not token:
        return jsonify({'error': 'userId and fcmToken required'}), 400
    try:
        db = get_db()
        c = db.cursor()
        c.execute('''INSERT INTO device_tokens (user_id, fcm_token, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE
            SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()''',
            (user_id, token))
        db.commit()
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('register_device_token error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/stores', methods=['GET'])
def get_stores():
    try:
        db = get_db()
        cur = dict_cursor(db)
        # Sort by store_views DESC (most visited first), then newest
        cur.execute('''SELECT id, name, email, storeName, businessType, categories, address, website, logo_path, createdAt, COALESCE(store_views, 0) AS store_views
            FROM users WHERE role = %s
            ORDER BY store_views DESC, createdAt DESC LIMIT 20''', ('seller',))
        rows = cur.fetchall()
        db.close()
        results = []
        for r in rows:
            results.append({
                'id': r['id'],
                'name': r['name'],
                'email': r['email'],
                'storeName': r['storename'],
                'businessType': r['businesstype'],
                'categories': r['categories'],
                'address': r['address'],
                'website': r['website'],
                'logo': r['logo_path'],
                'createdAt': r['createdat'],
                'storeViews': int(r['store_views'] or 0)
            })
        return jsonify(results)
    except Exception as e:
        print('stores error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/stores/<int:store_id>/view', methods=['POST'])
def increment_store_view(store_id):
    """Fire-and-forget store visit counter"""
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute('UPDATE users SET store_views = COALESCE(store_views, 0) + 1 WHERE id = %s AND role = %s', (store_id, 'seller'))
        db.commit()
        db.close()
        return jsonify({'ok': True})
    except Exception as e:
        print('store view error', e)
        return jsonify({'error': 'db error'}), 500


@app.route('/api/ads', methods=['GET'])
def get_ads():
    try:
        import json
        db = get_db()
        cur = dict_cursor(db)
        # Single query: pre-aggregate review stats in a subquery then join
        # avoids N+1 round-trips AND any GROUP BY functional-dependency issues
        cur.execute('''
            SELECT
                ads.*,
                users.name            AS author,
                users.storeName,
                users.role,
                users.profilePicture,
                COALESCE(rev.totalreviews, 0)   AS totalreviews,
                COALESCE(rev.averagerating, 0)  AS averagerating
            FROM ads
            LEFT JOIN users ON ads.userId = users.id
            LEFT JOIN (
                SELECT adId,
                       COUNT(*)   AS totalreviews,
                       AVG(rating) AS averagerating
                FROM reviews
                GROUP BY adId
            ) rev ON rev.adId = ads.id
            ORDER BY ads.createdAt DESC
        ''')
        rows = cur.fetchall()
        db.close()

        results = []
        for r in rows:
            row_keys = r.keys()
            try:
                tags_val = r['tags'] if 'tags' in row_keys else None
                tags = json.loads(tags_val) if tags_val else []
            except:
                tags = []
            try:
                category = r['category'] if 'category' in row_keys else None
            except:
                category = None

            total_reviews = r['totalreviews'] if r['totalreviews'] else 0
            avg_rating = round(float(r['averagerating']), 1) if r['averagerating'] else 0

            results.append({
                'id': r['id'],
                'title': r['title'],
                'description': r['description'],
                'userId': r['userid'],
                'createdAt': r['createdat'],
                'author': r['author'] if 'author' in row_keys else None,
                'storeName': r['storename'] if 'storename' in row_keys else None,
                'role': r['role'] if 'role' in row_keys else None,
                'profilePicture': r['profilepicture'] if 'profilepicture' in row_keys else None,
                'category': category,
                'tags': tags,
                'price': r['price'] if 'price' in row_keys and r['price'] is not None else None,
                'unit': r['unit'] if 'unit' in row_keys else None,
                'minOrder': r['minorder'] if 'minorder' in row_keys and r['minorder'] is not None else 1,
                'stock': r['stock'] if 'stock' in row_keys else None,
                'imageUrl': r['imageurl'] if 'imageurl' in row_keys else None,
                'images': r['images'] if 'images' in row_keys else None,
                'verified': r['verified'] if 'verified' in row_keys and r['verified'] is not None else 0,
                'views': r['views'] if 'views' in row_keys and r['views'] is not None else 0,
                'listingType': r['listingtype'] if 'listingtype' in row_keys else None,
                'reviewCount': total_reviews,
                'averageRating': avg_rating
            })

        return jsonify(results)
    except Exception as e:
        print('get_ads error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads', methods=['POST'])
def post_ad():
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    userId = data.get('userId')
    category = data.get('category')
    tags = data.get('tags', [])
    price = data.get('price')
    unit = data.get('unit')
    minOrder = data.get('minOrder', 1)
    stock = data.get('stock')
    imageUrl = data.get('imageUrl')
    images = data.get('images')
    listing_type = data.get('listingType')
    
    if not title or not description:
        return jsonify({'error': 'title and description required'}), 400
    try:
        import json
        db = get_db()
        cur = dict_cursor(db)
        tags_json = json.dumps(tags) if tags else None
        cur.execute('''INSERT INTO ads (title, description, userId, category, tags, price, unit, minOrder, stock, imageUrl, images, listingType) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''', 
                    (title, description, userId, category, tags_json, price, unit, minOrder, stock, imageUrl, images, listing_type))
        last = cur.fetchone()['id']
        db.commit()
        cur.execute('SELECT ads.*, users.name AS author, users.role FROM ads LEFT JOIN users ON ads.userId = users.id WHERE ads.id = %s', (last,))
        row = cur.fetchone()
        db.close()
        if row:
            row_keys = row.keys()
            result = {
                'id': row['id'], 'title': row['title'], 'description': row['description'], 
                'userId': row['userid'], 'createdAt': row['createdat'], 'author': row['author'],
                'category': row['category'] if 'category' in row_keys else None,
                'tags': json.loads(row['tags']) if row['tags'] else [],
                'price': row['price'] if 'price' in row_keys else None,
                'unit': row['unit'] if 'unit' in row_keys else None,
                'minOrder': row['minorder'] if 'minorder' in row_keys else 1,
                'stock': row['stock'] if 'stock' in row_keys else None,
                'imageUrl': row['imageurl'] if 'imageurl' in row_keys else None,
                'images': row['images'] if 'images' in row_keys else None,
                'verified': row['verified'] if 'verified' in row_keys else 0,
                'listingType': row['listingtype'] if 'listingtype' in row_keys else None
            }
            # Fire seller notification emails in the background for requirements
            if listing_type == 'requirement' and category:
                buyer_name = row['author'] or 'A buyer'
                t = threading.Thread(
                    target=notify_sellers_of_requirement,
                    args=(last, title, description, category, buyer_name),
                    daemon=True
                )
                t.start()
            return jsonify({'success': True, **result})
        return jsonify({'error': 'not found'}), 500
    except Exception as e:
        print('post_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads/<int:ad_id>', methods=['PUT'])
def update_ad(ad_id):
    """Update an existing ad/product/service"""
    try:
        data = request.get_json() or {}
        
        # Build update query dynamically based on provided fields
        update_fields = []
        values = []
        
        if 'title' in data:
            update_fields.append('title = %s')
            values.append(data['title'])
        if 'description' in data:
            update_fields.append('description = %s')
            values.append(data['description'])
        if 'price' in data:
            update_fields.append('price = %s')
            values.append(data['price'])
        if 'unit' in data:
            update_fields.append('unit = %s')
            values.append(data['unit'])
        if 'minOrder' in data:
            update_fields.append('minOrder = %s')
            values.append(data['minOrder'])
        if 'category' in data:
            update_fields.append('category = %s')
            values.append(data['category'])
        if 'tags' in data:
            import json
            update_fields.append('tags = %s')
            values.append(json.dumps(data['tags']))
        if 'imageUrl' in data:
            update_fields.append('imageUrl = %s')
            values.append(data['imageUrl'])
        if 'images' in data:
            update_fields.append('images = %s')
            values.append(data['images'])
        if 'stock' in data:
            update_fields.append('stock = %s')
            values.append(data['stock'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        values.append(ad_id)
        
        db = get_db()
        cursor = dict_cursor(db)
        query = f"UPDATE ads SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, values)
        db.commit()
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'success': False, 'error': 'Ad not found'}), 404
        
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('update_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads/<int:ad_id>/view', methods=['POST'])
def increment_view(ad_id):
    """Increment the view counter for a listing."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE ads SET views = COALESCE(views, 0) + 1 WHERE id = %s', (ad_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        print('increment_view error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads/<int:ad_id>', methods=['DELETE'])
def delete_ad(ad_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM ads WHERE id = %s', (ad_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Ad not found'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        print('delete_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    try:
        # Support JSON or multipart/form-data for profile picture upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = dict(request.form)
            files = request.files
        else:
            data = request.get_json() or {}
            files = {}
        
        user_id = data.get('userId')
        if not user_id:
            return jsonify({'error': 'userId required'}), 400
        
        # Handle profile picture upload
        profile_picture = None
        pic_file = files.get('profilePicture') if files else None
        if pic_file and getattr(pic_file, 'filename', None):
            stem = Path(secure_filename(pic_file.filename)).stem
            ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            key = f"uploads/profiles/profile_{ts}_{stem}.webp"
            profile_picture = _upload_image_to_s3(pic_file.stream, key, max_px=_AVATAR_MAX_PX, quality=85)
        
        # Build update query dynamically
        updates = []
        params = []
        
        if 'name' in data:
            updates.append('name = %s')
            params.append(data['name'])
        if 'phone' in data:
            updates.append('phone = %s')
            params.append(data['phone'])
        if 'location' in data:
            updates.append('location = %s')
            params.append(data['location'])
        if 'storeName' in data:
            updates.append('storeName = %s')
            params.append(data['storeName'])
        if 'businessType' in data:
            updates.append('businessType = %s')
            params.append(data['businessType'])
        if 'address' in data:
            updates.append('address = %s')
            params.append(data['address'])
        for field in ['tagline', 'storeDescription', 'ownerMessage', 'yearEstablished',
                      'employeeCount', 'annualTurnover', 'paymentModes', 'exportMarkets',
                      'certifications', 'whyUs']:
            if field in data:
                db_col = field.lower()  # map camelCase form field to lowercase DB column
                updates.append(f'{db_col} = %s')
                params.append(data[field])
        if profile_picture:
            updates.append('profilePicture = %s')
            params.append(profile_picture)
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute(query, params)
        db.commit()
        
        # Fetch updated user data
        cursor.execute('''
            SELECT id, name, email, phone, role, storeName, businessType, categories,
                   taxNumber, address, website, logo_path, uniqueId, location, profilePicture,
                   tagline, storeDescription, ownerMessage, yearEstablished, employeeCount,
                   annualTurnover, paymentModes, exportMarkets, certifications, whyUs
            FROM users WHERE id = %s
        ''', (user_id,))
        row = cursor.fetchone()
        db.close()
        
        if not row:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'success': True,
            'id': row['id'],
            'name': row['name'],
            'email': row['email'],
            'phone': row['phone'],
            'role': row['role'],
            'storeName': row['storename'],
            'businessType': row['businesstype'],
            'categories': row['categories'],
            'taxNumber': row['taxnumber'],
            'address': row['address'],
            'website': row['website'],
            'logo': row['logo_path'],
            'uniqueId': row['uniqueid'],
            'location': row['location'],
            'profilePicture': row['profilepicture'],
            'tagline': row['tagline'],
            'storeDescription': row['storedescription'],
            'ownerMessage': row['ownermessage'],
            'yearEstablished': row['yearestablished'],
            'employeeCount': row['employeecount'],
            'annualTurnover': row['annualturnover'],
            'paymentModes': row['paymentmodes'],
            'exportMarkets': row['exportmarkets'],
            'certifications': row['certifications'],
            'whyUs': row['whyus'],
        }
        return jsonify(user_data)
    except Exception as e:
        print('update_profile error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


# Public store profile endpoint
@app.route('/api/user/public/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    try:
        import json
        db = get_db()
        cur = dict_cursor(db)
        cur.execute('''
            SELECT id, name, email, phone, role, storeName, businessType, categories,
                   taxNumber, address, website, logo_path, uniqueId, location, profilePicture,
                   tagline, storeDescription, ownerMessage, yearEstablished, employeeCount,
                   annualTurnover, paymentModes, exportMarkets, certifications, whyUs,
                   createdAt
            FROM users WHERE id = %s
        ''', (user_id,))
        row = cur.fetchone()
        # Fetch products/services for this seller
        cur.execute('''
            SELECT id, title, description, price, unit, category, tags, imageUrl, images, createdAt
            FROM ads WHERE userId = %s ORDER BY createdAt DESC
        ''', (user_id,))
        ads = cur.fetchall()
        db.close()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        profile = {
            'id': row['id'],
            'name': row['name'],
            'email': row['email'],
            'phone': row['phone'],
            'role': row['role'],
            'storeName': row['storename'],
            'businessType': row['businesstype'],
            'categories': row['categories'],
            'taxNumber': row['taxnumber'],
            'address': row['address'],
            'website': row['website'],
            'logo': row['logo_path'],
            'uniqueId': row['uniqueid'],
            'location': row['location'],
            'profilePicture': row['profilepicture'],
            'tagline': row['tagline'],
            'storeDescription': row['storedescription'],
            'ownerMessage': row['ownermessage'],
            'yearEstablished': row['yearestablished'],
            'employeeCount': row['employeecount'],
            'annualTurnover': row['annualturnover'],
            'paymentModes': row['paymentmodes'],
            'exportMarkets': row['exportmarkets'],
            'certifications': row['certifications'],
            'whyUs': row['whyus'],
            'createdAt': str(row['createdat']) if row['createdat'] else None,
        }
        products = []
        for a in ads:
            tags = a['tags']
            try:
                tags = json.loads(tags) if isinstance(tags, str) else tags
            except Exception:
                tags = []
            products.append({
                'id': a['id'],
                'title': a['title'],
                'description': a['description'],
                'price': a['price'],
                'unit': a['unit'],
                'category': a['category'],
                'tags': tags or [],
                'imageUrl': a['imageurl'],
                'images': a['images'],
                'createdAt': str(a['createdat']) if a['createdat'] else None,
            })
        profile['products'] = products
        return jsonify(profile)
    except Exception as e:
        print('get_public_profile error:', e)
        import traceback; traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('SELECT id, name, email, phone, role, storeName, businessType, categories, address, website, logo_path, uniqueId, location, profilePicture, createdAt FROM users ORDER BY createdAt DESC')
        rows = cursor.fetchall()
        db.close()
        
        users = []
        for row in rows:
            users.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'role': row['role'],
                'storeName': row['storename'],
                'businessType': row['businesstype'],
                'categories': row['categories'],
                'address': row['address'],
                'website': row['website'],
                'logo': row['logo_path'],
                'uniqueId': row['uniqueid'],
                'location': row['location'],
                'profilePicture': row['profilepicture'],
                'createdAt': row['createdat']
            })
        
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        print('admin_get_users error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def admin_update_user(user_id):
    try:
        data = request.get_json() or {}
        
        # Build update query dynamically
        updates = []
        params = []
        
        if 'name' in data:
            updates.append('name = %s')
            params.append(data['name'])
        if 'email' in data:
            updates.append('email = %s')
            params.append(data['email'])
        if 'phone' in data:
            updates.append('phone = %s')
            params.append(data['phone'])
        if 'location' in data:
            updates.append('location = %s')
            params.append(data['location'])
        if 'storeName' in data:
            updates.append('storeName = %s')
            params.append(data['storeName'])
        if 'businessType' in data:
            updates.append('businessType = %s')
            params.append(data['businessType'])
        if 'address' in data:
            updates.append('address = %s')
            params.append(data['address'])
        if 'logo_path' in data:
            updates.append('logo_path = %s')
            params.append(data['logo_path'])
        if 'website' in data:
            updates.append('website = %s')
            params.append(data['website'])
        if 'categories' in data:
            updates.append('categories = %s')
            params.append(data['categories'])
        if 'taxNumber' in data:
            updates.append('taxNumber = %s')
            params.append(data['taxNumber'])
        if 'role' in data and data['role'] in ('buyer', 'seller', 'advertiser', 'admin'):
            updates.append('role = %s')
            params.append(data['role'])
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute(query, params)
        db.commit()
        db.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print('admin_update_user error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/users/<int:user_id>/password', methods=['PUT'])
def admin_reset_password(user_id):
    try:
        data = request.get_json() or {}
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'password required'}), 400
        
        hashed = generate_password_hash(password)
        
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('UPDATE users SET password = %s WHERE id = %s', (hashed, user_id))
        db.commit()
        db.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print('admin_reset_password error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    try:
        db = get_db()
        cursor = dict_cursor(db)
        
        # Delete user's ads first
        cursor.execute('DELETE FROM ads WHERE userId = %s', (user_id,))
        
        # Delete user
        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
        db.commit()
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('admin_delete_user error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/ads', methods=['GET'])
def admin_get_ads():
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT a.id, a.title, a.description, a.price, a.category, a.imageUrl,
                   a.listingType, a.verified, a.views, a.createdAt,
                   u.name AS authorName, u.storeName, a.userId
            FROM ads a
            LEFT JOIN users u ON a.userId = u.id
            ORDER BY a.createdAt DESC
        ''')
        rows = cursor.fetchall()
        db.close()
        ads = []
        for row in rows:
            ads.append({
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'price': row['price'],
                'category': row['category'],
                'imageUrl': row['imageurl'],
                'listingType': row['listingtype'],
                'verified': row['verified'],
                'views': row['views'],
                'createdAt': row['createdat'],
                'authorName': row['authorname'],
                'storeName': row['storename'],
                'userId': row['userid'],
            })
        return jsonify({'success': True, 'ads': ads})
    except Exception as e:
        print('admin_get_ads error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/ads/<int:ad_id>', methods=['PUT'])
def admin_update_ad(ad_id):
    try:
        data = request.get_json() or {}
        updates = []
        params = []
        for field in ('title', 'description', 'price', 'category'):
            if field in data:
                updates.append(f'{field} = %s')
                params.append(data[field])
        if 'verified' in data:
            updates.append('verified = %s')
            params.append(1 if data['verified'] else 0)
        if 'imageUrl' in data:
            updates.append('imageUrl = %s')
            params.append(data['imageUrl'])
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        params.append(ad_id)
        query = f"UPDATE ads SET {', '.join(updates)} WHERE id = %s"
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute(query, params)
        db.commit()
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('admin_update_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/ads/<int:ad_id>', methods=['DELETE'])
def admin_delete_ad(ad_id):
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('DELETE FROM ads WHERE id = %s', (ad_id,))
        db.commit()
        deleted = cursor.rowcount
        db.close()
        if deleted == 0:
            return jsonify({'success': False, 'error': 'Listing not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        print('admin_delete_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/banner-ads', methods=['GET'])
def admin_get_banner_ads():
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT b.id, b.userId, b.title, b.description, b.imageUrl, b.targetUrl,
                   b.status, b.createdAt, b.expiresAt,
                   b.contactName, b.contactNumber, b.industry, b.adAddress, b.notes,
                   u.name AS advertiserName, u.storeName AS advertiserCompany
            FROM banner_ads b
            LEFT JOIN users u ON u.id = b.userId
            ORDER BY b.createdAt DESC
        ''')
        rows = cursor.fetchall()
        db.close()
        ads = [{
            'id': r['id'], 'userId': r['userid'], 'title': r['title'],
            'description': r['description'], 'imageUrl': r['imageurl'],
            'targetUrl': r['targeturl'], 'status': r['status'],
            'contactName': r['contactname'], 'contactNumber': r['contactnumber'],
            'industry': r['industry'], 'adAddress': r['adaddress'], 'notes': r['notes'],
            'advertiserName': r['advertisername'], 'advertiserCompany': r['advertisercompany'],
            'createdAt': r['createdat'].isoformat() if r['createdat'] else None,
            'expiresAt': r['expiresat'].isoformat() if r['expiresat'] else None,
        } for r in rows]
        return jsonify({'success': True, 'ads': ads})
    except Exception as e:
        print('admin_get_banner_ads error:', e)
        import traceback; traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/banner-ads/<int:ad_id>', methods=['PUT'])
def admin_update_banner_ad(ad_id):
    try:
        data = request.get_json() or {}
        updates = []
        params = []
        for field in ('title', 'description', 'targetUrl', 'status', 'expiresAt',
                      'contactName', 'contactNumber', 'industry', 'adAddress', 'notes'):
            if field in data:
                updates.append(f'{field} = %s')
                params.append(data[field] or None)
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        params.append(ad_id)
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute(f"UPDATE banner_ads SET {', '.join(updates)} WHERE id = %s", params)
        db.commit()
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('admin_update_banner_ad error:', e)
        import traceback; traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/admin/banner-ads/<int:ad_id>', methods=['DELETE'])
def admin_delete_banner_ad(ad_id):
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('DELETE FROM banner_ads WHERE id = %s', (ad_id,))
        db.commit()
        deleted = cursor.rowcount
        db.close()
        if deleted == 0:
            return jsonify({'success': False, 'error': 'Banner ad not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        print('admin_delete_banner_ad error:', e)
        import traceback; traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/conversations', methods=['POST'])
def start_conversation():
    """Start a new conversation (buyer initiates with seller)"""
    try:
        data = request.get_json() or {}
        buyer_id = data.get('buyerId')
        seller_id = data.get('sellerId')
        listing_id = data.get('listingId')
        
        if not all([buyer_id, seller_id]):
            return jsonify({'error': 'buyerId and sellerId required'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Check if conversation already exists
        cursor.execute('''
            SELECT id FROM conversations 
            WHERE buyerId = %s AND sellerId = %s
        ''', (buyer_id, seller_id))
        existing = cursor.fetchone()
        
        if existing:
            db.close()
            return jsonify({'success': True, 'conversationId': existing['id']})
        
        # Create new conversation
        cursor.execute('''
            INSERT INTO conversations (buyerId, sellerId, listingId)
            VALUES (%s, %s, %s) RETURNING id
        ''', (buyer_id, seller_id, listing_id))
        conversation_id = cursor.fetchone()['id']
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'conversationId': conversation_id})
    except Exception as e:
        print('start_conversation error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/conversations/<int:user_id>', methods=['GET'])
def get_user_conversations(user_id):
    """Get all conversations for a user"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        
        # Get conversations where user is buyer or seller
        cursor.execute('''
            SELECT 
                c.id, c.buyerId, c.sellerId, c.listingId, c.createdAt,
                buyer.name as buyerName, buyer.email as buyerEmail, buyer.profilePicture as buyerPicture,
                seller.name as sellerName, seller.email as sellerEmail, seller.profilePicture as sellerPicture,
                seller.storeName,
                (SELECT message FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessage,
                (SELECT createdAt FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessageTime,
                (SELECT COUNT(*) FROM messages WHERE conversationId = c.id AND senderId != %s AND isRead = 0) as unreadCount
            FROM conversations c
            JOIN users buyer ON c.buyerId = buyer.id
            JOIN users seller ON c.sellerId = seller.id
            WHERE c.buyerId = %s OR c.sellerId = %s
            ORDER BY lastMessageTime DESC, c.createdAt DESC
        ''', (user_id, user_id, user_id))
        
        rows = cursor.fetchall()
        conversations = []
        for r in rows:
            conversations.append({
                'id': r['id'],
                'buyerId': r['buyerid'],
                'sellerId': r['sellerid'],
                'listingId': r['listingid'],
                'createdAt': r['createdat'],
                'buyerName': r['buyername'],
                'buyerEmail': r['buyeremail'],
                'buyerPicture': r['buyerpicture'],
                'sellerName': r['sellername'],
                'sellerEmail': r['selleremail'],
                'sellerPicture': r['sellerpicture'],
                'storeName': r['storename'],
                'lastMessage': r['lastmessage'],
                'lastMessageTime': r['lastmessagetime'],
                'unreadCount': r['unreadcount']
            })
        
        db.close()
        return jsonify(conversations)
    except Exception as e:
        print('get_user_conversations error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/messages/<int:conversation_id>', methods=['GET'])
def get_messages(conversation_id):
    """Get all messages in a conversation"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        
        cursor.execute('''
            SELECT 
                m.id, m.conversationId, m.senderId, m.message, m.createdAt,
                u.name as senderName, u.email as senderEmail, u.profilePicture
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.conversationId = %s
            ORDER BY m.createdAt ASC
        ''', (conversation_id,))
        
        rows = cursor.fetchall()
        messages = []
        for r in rows:
            messages.append({
                'id': r['id'],
                'conversationId': r['conversationid'],
                'senderId': r['senderid'],
                'message': r['message'],
                'createdAt': r['createdat'],
                'senderName': r['sendername'],
                'senderEmail': r['senderemail'],
                'senderPicture': r['profilepicture']
            })
        
        db.close()
        return jsonify(messages)
    except Exception as e:
        print('get_messages error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/messages', methods=['POST'])
def send_message():
    """Send a message in a conversation"""
    try:
        data = request.get_json() or {}
        conversation_id = data.get('conversationId')
        sender_id = data.get('senderId')
        message = data.get('message')
        
        if not all([conversation_id, sender_id, message]):
            return jsonify({'error': 'conversationId, senderId, and message required'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Verify user is part of this conversation
        cursor.execute('''
            SELECT buyerId, sellerId FROM conversations WHERE id = %s
        ''', (conversation_id,))
        conv = cursor.fetchone()
        
        if not conv or (sender_id != conv['buyerid'] and sender_id != conv['sellerid']):
            db.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Fetch sender name for push notification
        cursor.execute('SELECT name FROM users WHERE id = %s', (sender_id,))
        sender_row = cursor.fetchone()
        sender_name = sender_row['name'] if sender_row else 'Someone'

        # Insert message
        cursor.execute('''
            INSERT INTO messages (conversationId, senderId, message, isRead)
            VALUES (%s, %s, %s, 0) RETURNING id
        ''', (conversation_id, sender_id, message))
        message_id = cursor.fetchone()['id']
        db.commit()
        db.close()
        
        # Notify both participants via SSE so the UI updates in real time
        recipient_id = conv['sellerid'] if sender_id == conv['buyerid'] else conv['buyerid']
        event_payload = {'conversationId': conversation_id, 'messageId': message_id, 'senderId': sender_id}
        _sse_publish(recipient_id, 'new_message', event_payload)
        _sse_publish(sender_id,    'new_message', event_payload)

        # Push FCM notification to the recipient
        for tok in _get_fcm_tokens([recipient_id]):
            _send_fcm(tok, sender_name, message[:100],
                      {'type': 'new_message', 'conversationId': str(conversation_id)})

        return jsonify({'success': True, 'messageId': message_id})
    except Exception as e:
        print('send_message error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/sse/<int:user_id>')
def sse_stream(user_id):
    """Server-Sent Events stream — uses Redis when available, in-memory otherwise."""
    def generate():
        if USE_REDIS:
            # Each SSE connection gets its own Redis pubsub subscription.
            # With gevent workers this is a cooperative (non-blocking) wait.
            r = _redis_lib.from_url(_redis_url, decode_responses=True, socket_timeout=30)
            pubsub = r.pubsub(ignore_subscribe_messages=True)
            channel = f'bigspice:user:{user_id}'
            pubsub.subscribe(channel)
            try:
                yield 'data: {"type":"connected"}\n\n'
                while True:
                    msg = pubsub.get_message(timeout=25)
                    if msg and msg.get('type') == 'message':
                        yield f'data: {msg["data"]}\n\n'
                    else:
                        yield ': keepalive\n\n'
            finally:
                try:
                    pubsub.unsubscribe(channel)
                    pubsub.close()
                    r.close()
                except Exception:
                    pass
        else:
            # Single-process in-memory fallback
            q = _sse_subscribe(user_id)
            try:
                yield 'data: {"type":"connected"}\n\n'
                while True:
                    try:
                        event = q.get(timeout=25)
                        yield f'data: {json.dumps(event)}\n\n'
                    except queue.Empty:
                        yield ': keepalive\n\n'
            finally:
                _sse_unsubscribe(user_id, q)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        }
    )


@app.route('/api/messages/unread/<int:user_id>', methods=['GET'])
def get_unread_count(user_id):
    """Get count of unread messages for a user"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        
        # Count unread messages where user is the recipient (not the sender)
        cursor.execute('''
            SELECT COUNT(*) as count FROM messages m
            JOIN conversations c ON m.conversationId = c.id
            WHERE m.isRead = 0 
            AND m.senderId != %s
            AND (c.buyerId = %s OR c.sellerId = %s)
        ''', (user_id, user_id, user_id))
        
        count = cursor.fetchone()['count']
        db.close()
        
        return jsonify({'unreadCount': count})
    except Exception as e:
        print('get_unread_count error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/messages/mark-read/<int:conversation_id>', methods=['POST'])
def mark_messages_read(conversation_id):
    """Mark all messages in a conversation as read for the current user"""
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'userId required'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Mark messages as read where user is the recipient
        cursor.execute('''
            UPDATE messages 
            SET isRead = 1 
            WHERE conversationId = %s 
            AND senderId != %s
            AND isRead = 0
        ''', (conversation_id, user_id))
        
        db.commit()
        db.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print('mark_messages_read error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/banner-ads', methods=['GET'])
def get_banner_ads():
    """Get all active, non-expired banner ads for the homepage carousel"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT id, userId, title, description, imageUrl, targetUrl, status, createdAt, expiresAt
            FROM banner_ads
            WHERE status = 'active'
              AND (expiresAt IS NULL OR expiresAt >= CURRENT_DATE)
            ORDER BY createdAt DESC
        ''')
        rows = cursor.fetchall()
        db.close()
        return jsonify([{
            'id': r['id'],
            'userId': r['userid'],
            'title': r['title'],
            'description': r['description'],
            'imageUrl': r['imageurl'],
            'targetUrl': r['targeturl'],
            'status': r['status'],
            'createdAt': r['createdat'].isoformat() if r['createdat'] else None,
            'expiresAt': r['expiresat'].isoformat() if r['expiresat'] else None,
        } for r in rows])
    except Exception as e:
        print('get_banner_ads error:', e)
        return jsonify([])  # return empty so carousel falls back to defaults


@app.route('/api/banner-ads', methods=['POST'])
def create_banner_ad():
    """Create a new banner ad (advertiser role)"""
    try:
        user_id    = request.form.get('userId')
        title      = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        target_url = request.form.get('targetUrl', '').strip()
        expires_at = request.form.get('expiresAt') or None
        contact_name   = request.form.get('contactName', '').strip()
        contact_number = request.form.get('contactNumber', '').strip()
        industry       = request.form.get('industry', '').strip()
        ad_address     = request.form.get('adAddress', '').strip()
        notes          = request.form.get('notes', '').strip()

        if not all([user_id, title, target_url]):
            return jsonify({'error': 'userId, title, and targetUrl are required'}), 400

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid userId'}), 400

        # Save banner image
        if 'image' not in request.files or not request.files['image'].filename:
            return jsonify({'error': 'Banner image is required'}), 400
        file = request.files['image']
        ext = os.path.splitext(secure_filename(file.filename))[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return jsonify({'error': 'Image must be JPG, PNG, or WebP'}), 400
        fname = f'banner_{uuid.uuid4().hex}.webp'
        key = f'uploads/banners/{fname}'
        image_url = _upload_image_to_s3(file.stream, key, max_px=1600, quality=85)

        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            INSERT INTO banner_ads (userId, title, description, imageUrl, targetUrl, status, expiresAt,
                                    contactName, contactNumber, industry, adAddress, notes)
            VALUES (%s, %s, %s, %s, %s, 'active', %s, %s, %s, %s, %s, %s) RETURNING id
        ''', (user_id, title, description, image_url, target_url, expires_at,
              contact_name, contact_number, industry, ad_address, notes))
        ad_id = cursor.fetchone()['id']
        db.commit()
        db.close()
        return jsonify({'success': True, 'id': ad_id})
    except Exception as e:
        print('create_banner_ad error:', e)
        import traceback; traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/banner-ads/my/<int:user_id>', methods=['GET'])
def get_my_banner_ads(user_id):
    """Get all banner ads for a specific advertiser"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT id, userId, title, description, imageUrl, targetUrl, status, createdAt, expiresAt,
                   contactName, contactNumber, industry, adAddress, notes
            FROM banner_ads WHERE userId = %s ORDER BY createdAt DESC
        ''', (user_id,))
        rows = cursor.fetchall()
        db.close()
        return jsonify([{
            'id': r['id'],
            'userId': r['userid'],
            'title': r['title'],
            'description': r['description'],
            'imageUrl': r['imageurl'],
            'targetUrl': r['targeturl'],
            'status': r['status'],
            'contactName': r['contactname'],
            'contactNumber': r['contactnumber'],
            'industry': r['industry'],
            'adAddress': r['adaddress'],
            'notes': r['notes'],
            'createdAt': r['createdat'].isoformat() if r['createdat'] else None,
            'expiresAt': r['expiresat'].isoformat() if r['expiresat'] else None,
        } for r in rows])
    except Exception as e:
        print('get_my_banner_ads error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/banner-ads/<int:ad_id>', methods=['GET'])
def get_banner_ad(ad_id):
    """Get a single banner ad by ID (for the ad detail page)"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT b.id, b.userId, b.title, b.description, b.imageUrl, b.targetUrl,
                   b.status, b.createdAt, b.expiresAt,
                   b.contactName, b.contactNumber, b.industry, b.adAddress, b.notes,
                   u.name AS advertiserName, u.storeName AS advertiserCompany
            FROM banner_ads b
            LEFT JOIN users u ON u.id = b.userId
            WHERE b.id = %s
        ''', (ad_id,))
        r = cursor.fetchone()
        db.close()
        if not r:
            return jsonify({'error': 'Ad not found'}), 404
        return jsonify({
            'id': r['id'],
            'userId': r['userid'],
            'title': r['title'],
            'description': r['description'],
            'imageUrl': r['imageurl'],
            'targetUrl': r['targeturl'],
            'status': r['status'],
            'advertiserName': r['advertisername'],
            'advertiserCompany': r['advertisercompany'],
            'contactName': r['contactname'],
            'contactNumber': r['contactnumber'],
            'industry': r['industry'],
            'adAddress': r['adaddress'],
            'notes': r['notes'],
            'createdAt': r['createdat'].isoformat() if r['createdat'] else None,
            'expiresAt': r['expiresat'].isoformat() if r['expiresat'] else None,
        })
    except Exception as e:
        print('get_banner_ad error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/banner-ads/<int:ad_id>', methods=['PUT'])
def update_banner_ad(ad_id):
    """Update a banner ad (owner only)"""
    try:
        user_id = request.form.get('userId') or (request.get_json() or {}).get('userId')
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('SELECT userId FROM banner_ads WHERE id = %s', (ad_id,))
        row = cursor.fetchone()
        if not row:
            db.close(); return jsonify({'error': 'Ad not found'}), 404
        if str(row['userid']) != str(user_id):
            db.close(); return jsonify({'error': 'Unauthorized'}), 403

        updates = {}
        for field in ['title', 'description', 'targetUrl', 'expiresAt', 'status',
                        'contactName', 'contactNumber', 'industry', 'adAddress', 'notes']:
            val = request.form.get(field)
            if val is not None:
                updates[field] = val or None

        if 'image' in request.files and request.files['image'].filename:
            file = request.files['image']
            fname = f'banner_{uuid.uuid4().hex}.webp'
            key = f'uploads/banners/{fname}'
            updates['imageUrl'] = _upload_image_to_s3(file.stream, key, max_px=1600)

        if not updates:
            db.close(); return jsonify({'error': 'No fields to update'}), 400

        col_map = {'title': 'title', 'description': 'description', 'targetUrl': 'targeturl',
                   'expiresAt': 'expiresat', 'status': 'status', 'imageUrl': 'imageurl',
                   'contactName': 'contactname', 'contactNumber': 'contactnumber',
                   'industry': 'industry', 'adAddress': 'adaddress', 'notes': 'notes'}
        set_clause = ', '.join(f"{col_map[k]} = %s" for k in updates)
        values = list(updates.values()) + [ad_id]
        cursor.execute(f'UPDATE banner_ads SET {set_clause} WHERE id = %s', values)
        db.commit()
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('update_banner_ad error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/banner-ads/<int:ad_id>', methods=['DELETE'])
def delete_banner_ad(ad_id):
    """Delete a banner ad"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('DELETE FROM banner_ads WHERE id = %s', (ad_id,))
        db.commit()
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('delete_banner_ad error:', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/wishlist/<int:user_id>', methods=['GET'])
def get_wishlist(user_id):
    """Get all wishlist items for a user"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        
        cursor.execute('''
            SELECT 
                w.id as wishlistId, w.createdAt as addedAt,
                ads.*, 
                users.name AS author, 
                users.storeName, 
                users.role, 
                users.profilePicture
            FROM wishlist w
            JOIN ads ON w.adId = ads.id
            LEFT JOIN users ON ads.userId = users.id
            WHERE w.userId = %s
            ORDER BY w.createdAt DESC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        results = []
        for r in rows:
            import json
            row_keys = r.keys()
            try:
                tags_val = r['tags'] if 'tags' in row_keys else None
                tags = json.loads(tags_val) if tags_val else []
            except:
                tags = []
            
            results.append({
                'wishlistId': r['wishlistid'],
                'addedAt': r['addedat'],
                'id': r['id'],
                'title': r['title'],
                'description': r['description'],
                'userId': r['userid'],
                'createdAt': r['createdat'],
                'author': r['author'] if 'author' in row_keys else None,
                'storeName': r['storename'] if 'storename' in row_keys else None,
                'role': r['role'] if 'role' in row_keys else None,
                'profilePicture': r['profilepicture'] if 'profilepicture' in row_keys else None,
                'category': r['category'] if 'category' in row_keys else None,
                'tags': tags,
                'price': r['price'] if 'price' in row_keys and r['price'] is not None else None,
                'unit': r['unit'] if 'unit' in row_keys else None,
                'minOrder': r['minorder'] if 'minorder' in row_keys and r['minorder'] is not None else 1,
                'stock': r['stock'] if 'stock' in row_keys else None,
                'imageUrl': r['imageurl'] if 'imageurl' in row_keys else None
            })
        
        db.close()
        return jsonify(results)
    except Exception as e:
        print('get_wishlist error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    """Add item to wishlist"""
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        ad_id = data.get('adId')
        
        if not user_id or not ad_id:
            return jsonify({'error': 'userId and adId required'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Check if already in wishlist
        cursor.execute('SELECT id FROM wishlist WHERE userId = %s AND adId = %s', (user_id, ad_id))
        existing = cursor.fetchone()
        
        if existing:
            db.close()
            return jsonify({'success': True, 'message': 'Already in wishlist'})
        
        # Add to wishlist
        cursor.execute('INSERT INTO wishlist (userId, adId) VALUES (%s, %s) RETURNING id', (user_id, ad_id))
        wishlist_id = cursor.fetchone()['id']
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'wishlistId': wishlist_id})
    except Exception as e:
        print('add_to_wishlist error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/wishlist/<int:wishlist_id>', methods=['DELETE'])
def remove_from_wishlist(wishlist_id):
    """Remove item from wishlist"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('DELETE FROM wishlist WHERE id = %s', (wishlist_id,))
        db.commit()
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'success': False, 'error': 'Item not found'}), 404
        
        db.close()
        return jsonify({'success': True})
    except Exception as e:
        print('remove_from_wishlist error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/wishlist/check', methods=['POST'])
def check_wishlist():
    """Check if item is in user's wishlist"""
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        ad_id = data.get('adId')
        
        if not user_id or not ad_id:
            return jsonify({'error': 'userId and adId required'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('SELECT id FROM wishlist WHERE userId = %s AND adId = %s', (user_id, ad_id))
        result = cursor.fetchone()
        db.close()
        
        return jsonify({'inWishlist': result is not None, 'wishlistId': result['id'] if result else None})
    except Exception as e:
        print('check_wishlist error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


# ===== REVIEWS API =====
@app.route('/api/reviews/<int:ad_id>', methods=['GET'])
def get_reviews(ad_id):
    """Get all reviews for a product"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT r.id, r.adId, r.userId, r.rating, r.reviewText, r.createdAt,
                   u.name as userName, u.profilePicture
            FROM reviews r
            LEFT JOIN users u ON r.userId = u.id
            WHERE r.adId = %s
            ORDER BY r.createdAt DESC
        ''', (ad_id,))
        
        reviews = []
        for row in cursor.fetchall():
            reviews.append({
                'id': row['id'],
                'adId': row['adid'],
                'userId': row['userid'],
                'rating': row['rating'],
                'reviewText': row['reviewtext'],
                'createdAt': row['createdat'],
                'userName': row['username'],
                'profilePicture': row['profilepicture']
            })
        
        db.close()
        return jsonify(reviews)
    except Exception as e:
        print('get_reviews error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/reviews', methods=['POST'])
def add_review():
    """Add a new review"""
    try:
        data = request.get_json() or {}
        ad_id = data.get('adId')
        user_id = data.get('userId')
        rating = data.get('rating')
        review_text = data.get('reviewText', '')
        
        if not ad_id or not user_id or not rating:
            return jsonify({'success': False, 'message': 'adId, userId, and rating required'}), 400
        
        if rating < 1 or rating > 5:
            return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Check if user owns this product
        cursor.execute('SELECT userId FROM ads WHERE id = %s', (ad_id,))
        ad_row = cursor.fetchone()
        if ad_row and ad_row['userid'] == user_id:
            db.close()
            return jsonify({'success': False, 'message': 'You cannot review your own product'}), 400
        
        # Check if user already reviewed this product
        cursor.execute('SELECT id FROM reviews WHERE userId = %s AND adId = %s', (user_id, ad_id))
        if cursor.fetchone():
            db.close()
            return jsonify({'success': False, 'message': 'You have already reviewed this product'}), 400
        
        cursor.execute('''
            INSERT INTO reviews (adId, userId, rating, reviewText)
            VALUES (%s, %s, %s, %s) RETURNING id
        ''', (ad_id, user_id, rating, review_text))
        
        review_id = cursor.fetchone()['id']
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'reviewId': review_id})
    except Exception as e:
        print('add_review error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    """Delete a review"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('DELETE FROM reviews WHERE id = %s', (review_id,))
        db.commit()
        db.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print('delete_review error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/reviews/stats/<int:ad_id>', methods=['GET'])
def get_review_stats(ad_id):
    """Get review statistics for a product"""
    try:
        db = get_db()
        cursor = dict_cursor(db)
        cursor.execute('''
            SELECT 
                COUNT(*) as totalReviews,
                AVG(rating) as averageRating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStars,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStars,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStars,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStars,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStar
            FROM reviews
            WHERE adId = %s
        ''', (ad_id,))
        
        row = cursor.fetchone()
        db.close()
        
        stats = {
            'totalReviews': row['totalreviews'] or 0,
            'averageRating': round(row['averagerating'], 1) if row['averagerating'] else 0,
            'fiveStars': row['fivestars'] or 0,
            'fourStars': row['fourstars'] or 0,
            'threeStars': row['threestars'] or 0,
            'twoStars': row['twostars'] or 0,
            'oneStar': row['onestar'] or 0
        }
        
        return jsonify(stats)
    except Exception as e:
        print('get_review_stats error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/reviews/can-review/<int:ad_id>', methods=['POST'])
def can_review(ad_id):
    """Check if a user can review a product"""
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'canReview': False, 'reason': 'User not logged in'}), 400
        
        db = get_db()
        cursor = dict_cursor(db)
        
        # Check if user owns this product
        cursor.execute('SELECT userId FROM ads WHERE id = %s', (ad_id,))
        ad_row = cursor.fetchone()
        if not ad_row:
            db.close()
            return jsonify({'canReview': False, 'reason': 'Product not found'}), 404
            
        if ad_row['userid'] == user_id:
            db.close()
            return jsonify({'canReview': False, 'reason': 'Cannot review your own product'})
        
        # Check if user already reviewed this product
        cursor.execute('SELECT id FROM reviews WHERE userId = %s AND adId = %s', (user_id, ad_id))
        if cursor.fetchone():
            db.close()
            return jsonify({'canReview': False, 'reason': 'You have already reviewed this product'})
        
        db.close()
        return jsonify({'canReview': True, 'reason': ''})
    except Exception as e:
        print('can_review error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded files with long-lived cache headers."""
    response = send_from_directory(str(BASE_DIR / 'public' / 'uploads'), filename)
    # Images are content-addressed (timestamp in name) so cache for 1 year
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


# ── Device-aware homepage ─────────────────────────────────────────────────────
@app.route('/')
def index():
    """
    Mobile → Jinja2 template (templates/mobile/index.html).
    Desktop → original static public/index.html (unchanged).

    Override precedence:
      1. ?view=mobile|desktop  query param
      2. 'view' cookie
      3. User-Agent detection
    """
    device = getattr(g, 'device', 'desktop')
    view_override = getattr(g, 'view_override', None)

    if device == 'desktop':
        # Serve the original static page exactly as before
        resp = send_from_directory(str(BASE_DIR / 'public'), 'index.html')
        resp.headers['Cache-Control'] = 'no-cache'
        return resp

    # Mobile: Jinja2 template
    html = render_template('mobile/index.html')
    resp = make_response(html)
    resp.headers['Cache-Control'] = 'no-cache, no-store'
    if view_override:
        resp.set_cookie(
            'view', view_override,
            max_age=365 * 24 * 3600,
            samesite='Lax',
            httponly=False,
        )
    return resp
# ─────────────────────────────────────────────────────────────────────────────


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Serve static files from public/, fallback to index.html
    if path != '' and (BASE_DIR / 'public' / path).exists():
        resp = send_from_directory(str(BASE_DIR / 'public'), path)
        # Cache CSS/JS/fonts/images for 7 days; HTML stays fresh
        ext = Path(path).suffix.lower()
        if ext in ('.css', '.js', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'):
            resp.headers['Cache-Control'] = 'public, max-age=604800'
        else:
            resp.headers['Cache-Control'] = 'no-cache'
        return resp
    return send_from_directory(str(BASE_DIR / 'public'), 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Dev server only. For production use: gunicorn -c gunicorn.conf.py app:app
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)

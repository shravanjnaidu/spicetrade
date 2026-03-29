# ── Gevent monkey patching ── must be the very first code executed ───────────
try:
    from gevent import monkey; monkey.patch_all()
except ImportError:
    pass  # gevent not installed; falls back to standard threaded mode
# ─────────────────────────────────────────────────────────────────────────────

import os
import json
import queue
import threading
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor


BASE_DIR = Path(__file__).resolve().parent

# Load PostgreSQL credentials
with open(BASE_DIR / 'creds.json', 'r') as f:
    DB_CONFIG = json.load(f)

DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)


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


app = Flask(__name__, static_folder=str(BASE_DIR / 'public'), static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB upload limit
CORS(app)

# Initialize DB immediately so we don't rely on server hooks that may differ across environments
init_db()

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
    """Generic file upload endpoint for images - supports multiple files"""
    try:
        files = request.files.getlist('file')
        if not files or len(files) == 0:
            return jsonify({'error': 'No files provided'}), 400
        
        # Create uploads directory if it doesn't exist
        uploads_dir = BASE_DIR / 'public' / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_urls = []
        
        for file in files:
            if file.filename == '':
                continue
            
            # Generate secure filename with timestamp
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            filename = f"{timestamp}_{filename}"
            
            # Save file
            save_path = uploads_dir / filename
            file.save(str(save_path))
            
            # Add URL path
            url = f"/uploads/{filename}"
            uploaded_urls.append(url)
        
        if len(uploaded_urls) == 0:
            return jsonify({'error': 'No valid files uploaded'}), 400
        
        # Return single URL for backward compatibility, or array for multiple
        if len(uploaded_urls) == 1:
            return jsonify({'success': True, 'url': uploaded_urls[0]})
        else:
            return jsonify({'success': True, 'urls': uploaded_urls})
    except Exception as e:
        print('upload_file error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Upload failed'}), 500


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
        uploads_dir = BASE_DIR / 'public' / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)
        filename = secure_filename(logo_file.filename)
        # prefix with timestamp to avoid collisions
        ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        filename = f"{ts}_{filename}"
        save_path = uploads_dir / filename
        logo_file.save(str(save_path))
        logo_path = f"/uploads/{filename}"
    
    # handle profile picture upload (for buyers)
    profile_picture = None
    profile_file = files.get('profilePicture') if files else None
    if profile_file and getattr(profile_file, 'filename', None):
        uploads_dir = BASE_DIR / 'public' / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)
        filename = secure_filename(profile_file.filename)
        ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        filename = f"profile_{ts}_{filename}"
        save_path = uploads_dir / filename
        profile_file.save(str(save_path))
        profile_picture = f"/uploads/{filename}"

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
            'profilePicture': profile_picture
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
            'profilePicture': row['profilepicture']
        }
        return jsonify(user_data)
    except Exception as e:
        print('login error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/stores', methods=['GET'])
def get_stores():
    try:
        db = get_db()
        cur = dict_cursor(db)
        cur.execute('SELECT id, name, email, storeName, businessType, categories, address, website, logo_path, createdAt FROM users WHERE role = %s ORDER BY createdAt DESC LIMIT 20', ('seller',))
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
                'createdAt': r['createdat']
            })
        return jsonify(results)
    except Exception as e:
        print('stores error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads', methods=['GET'])
def get_ads():
    try:
        import json
        db = get_db()
        cur = dict_cursor(db)
        cur.execute('SELECT ads.*, users.name AS author, users.storeName, users.role, users.profilePicture FROM ads LEFT JOIN users ON ads.userId = users.id ORDER BY ads.createdAt DESC')
        rows = cur.fetchall()
        
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
            
            # Get review stats for this product
            ad_id = r['id']
            cur.execute('''
                SELECT 
                    COUNT(*) as totalReviews,
                    AVG(rating) as averageRating
                FROM reviews
                WHERE adId = %s
            ''', (ad_id,))
            review_row = cur.fetchone()
            total_reviews = review_row['totalreviews'] if review_row else 0
            avg_rating = round(review_row['averagerating'], 1) if review_row and review_row['averagerating'] else 0
            
            # Safely get values with defaults (PostgreSQL returns lowercase column names)
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
        
        db.close()
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
            uploads_dir = BASE_DIR / 'public' / 'uploads'
            uploads_dir.mkdir(parents=True, exist_ok=True)
            filename = secure_filename(pic_file.filename)
            ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            filename = f"profile_{ts}_{filename}"
            save_path = uploads_dir / filename
            pic_file.save(str(save_path))
            profile_picture = f"/uploads/{filename}"
        
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
        fname = f'banner_{uuid.uuid4().hex}{ext}'
        uploads_dir = BASE_DIR / 'public' / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)
        file.save(str(uploads_dir / fname))
        image_url = f'/uploads/{fname}'

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
            ext = os.path.splitext(secure_filename(file.filename))[1].lower()
            fname = f'banner_{uuid.uuid4().hex}{ext}'
            uploads_dir = BASE_DIR / 'public' / 'uploads'
            uploads_dir.mkdir(parents=True, exist_ok=True)
            file.save(str(uploads_dir / fname))
            updates['imageUrl'] = f'/uploads/{fname}'

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
    """Serve uploaded files directly — must come before the catch-all route."""
    return send_from_directory(str(BASE_DIR / 'public' / 'uploads'), filename)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Serve static files from public/, fallback to index.html
    if path != '' and (BASE_DIR / 'public' / path).exists():
        return send_from_directory(str(BASE_DIR / 'public'), path)
    return send_from_directory(str(BASE_DIR / 'public'), 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    # Dev server only. For production use: gunicorn -c gunicorn.conf.py app:app
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)

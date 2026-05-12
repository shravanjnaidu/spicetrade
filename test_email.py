"""
Test script — fires a requirement notification email via AWS SES.

Usage:
    python test_email.py [--to your@email.com] [--category "Spices & Herbs"]

Defaults:
    --to        reads from first seller email in DB (or use --to flag)
    --category  "Spices & Herbs"
"""
import argparse
import json
import os
import sys
import uuid
import boto3
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / 'creds.json') as f:
    DB_CONFIG = json.load(f)

APP_URL    = os.environ.get('APP_URL', 'https://www.bigspice.in')
SES_REGION = DB_CONFIG.get('ses_region', DB_CONFIG.get('aws_region', 'ap-south-2'))
SES_FROM   = 'BigSpice <noreply@bigspice.in>'

# ── SES client ────────────────────────────────────────────────────────────────
def _get_ses():
    ak = DB_CONFIG.get('aws_access_key_id', '').strip()
    sk = DB_CONFIG.get('aws_secret_access_key', '').strip()
    if ak and sk:
        return boto3.client('ses', region_name=SES_REGION,
                            aws_access_key_id=ak, aws_secret_access_key=sk)
    return boto3.client('ses', region_name=SES_REGION)

# ── Email HTML builder (standalone copy — no app.py import to avoid gevent) ──
def _requirement_email_html(buyer_name, title, description, category, listing_url):
    synopsis = (description[:300] + '…') if len(description) > 300 else description
    msg_id = uuid.uuid4()
    return f"""<!-- mid:{msg_id} -->
<!DOCTYPE html>
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
          <tr>
            <td style="background:linear-gradient(135deg,#b5451b 0%,#e07b39 100%);
                        padding:28px 40px 24px;text-align:center;">
              <!-- Logo -->
              <img src="https://bigspice-images.s3.ap-south-2.amazonaws.com/logos/bigspicelogo.png"
                   alt="BigSpice"
                   height="44"
                   style="display:block;margin:0 auto 10px;max-width:180px;" />
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:14px;letter-spacing:0.5px;">
                India's fastest growing B2B marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fff8f2;padding:14px 40px;border-bottom:1px solid #f0e6da;">
              <p style="margin:0;font-size:13px;color:#b5451b;font-weight:600;
                         text-transform:uppercase;letter-spacing:0.8px;">New Buyer Requirement</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">Hi there,</p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                A buyer has posted a new sourcing requirement that matches your listed category:</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fff8f2;border:1px solid #f0e6da;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;">
                      <span style="display:inline-block;background:#b5451b;color:#ffffff;
                                   font-size:11px;font-weight:700;letter-spacing:0.8px;
                                   text-transform:uppercase;padding:4px 10px;border-radius:4px;">{category}</span>
                    </p>
                    <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;font-weight:700;line-height:1.3;">{title}</h2>
                    <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.7;
                               border-left:3px solid #e07b39;padding-left:14px;">{synopsis}</p>
                    <p style="margin:0;font-size:13px;color:#888888;">
                      Posted by <strong style="color:#333333;">{buyer_name}</strong></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{listing_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#b5451b,#e07b39);
                               color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;
                               padding:14px 40px;border-radius:50px;
                               box-shadow:0 4px 14px rgba(181,69,27,0.35);letter-spacing:0.3px;">
                      View This Requirement &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:14px;color:#888888;line-height:1.6;">
                If the button doesn't work, paste this link into your browser:<br />
                <a href="{listing_url}" style="color:#b5451b;word-break:break-all;">{listing_url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#faf5ef;padding:24px 40px;border-top:1px solid #f0e6da;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#aaaaaa;">
                You're receiving this because you have listings in the
                <strong>{category}</strong> category on BigSpice.
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

# ── CLI args ──────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument('--to',       default=None,             help='Recipient email')
parser.add_argument('--category', default='Spices & Herbs', help='Category name')
parser.add_argument('--ad-id',    default=1, type=int,      help='Ad ID for CTA link')
args = parser.parse_args()

CATEGORY    = args.category
AD_ID       = args.ad_id
BUYER_NAME  = 'Test Buyer'
TITLE       = f'[TEST] Looking for premium {CATEGORY}'
DESCRIPTION = (
    'This is a test requirement generated by test_email.py. '
    'We are looking for high-quality bulk supply of the above category. '
    'Please respond with your best price and availability.'
)

# ── Resolve recipient ─────────────────────────────────────────────────────────
recipient = args.to
if not recipient:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'], port=DB_CONFIG['port'],
            dbname=DB_CONFIG['dbname'], user=DB_CONFIG['username'],
            password=DB_CONFIG['password']
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT DISTINCT u.email FROM users u
            JOIN ads a ON a.userid = u.id
            WHERE u.role = 'seller' AND u.email IS NOT NULL
              AND a.category = %s
              AND (a.listingtype IS NULL OR a.listingtype != 'requirement')
            LIMIT 1
        """, (CATEGORY,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if row:
            recipient = row['email']
            print(f'[test] Auto-selected seller email from DB: {recipient}')
        else:
            print(f'[test] No seller found for category "{CATEGORY}".')
            print('[test] Use --to your@email.com to override.')
            sys.exit(1)
    except Exception as e:
        print(f'[test] DB lookup failed: {e}')
        print('[test] Use --to your@email.com to skip DB lookup.')
        sys.exit(1)

# ── Build and send ────────────────────────────────────────────────────────────
listing_url = f'{APP_URL}/listing/{AD_ID}'
html = _requirement_email_html(BUYER_NAME, TITLE, DESCRIPTION, CATEGORY, listing_url)

print(f'[test] Sending via SES ({SES_REGION})')
print(f'[test] From:    {SES_FROM}')
print(f'[test] To:      {recipient}')
print(f'[test] Subject: New Buyer Requirement: {TITLE}')
print(f'[test] CTA URL: {listing_url}')

try:
    resp = _get_ses().send_email(
        Source=SES_FROM,
        Destination={'ToAddresses': [recipient]},
        Message={
            'Subject': {'Data': f'New Buyer Requirement: {TITLE}', 'Charset': 'UTF-8'},
            'Body':    {'Html': {'Data': html, 'Charset': 'UTF-8'}},
        },
    )
    print(f'[test] ✓ Email sent! SES MessageId: {resp["MessageId"]}')
except Exception as exc:
    print(f'[test] ✗ Failed: {exc}')
    sys.exit(1)

import os
import sqlite3
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent
import os
import sqlite3
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = str(DATA_DIR / 'db.sqlite')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    db = get_db()
    cur = db.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        userId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )''')
    db.commit()
    db.close()

    # Ensure any missing columns are added (simple migrations)
    cur = get_db().cursor()
    cols = [r['name'] for r in get_db().cursor().execute("PRAGMA table_info(users)").fetchall()]
    # above line opened new connection; fetch column names robustly
    db2 = get_db()
    cur2 = db2.cursor()
    cur2.execute("PRAGMA table_info(users)")
    existing = [r[1] for r in cur2.fetchall()]
    needed = {
        'phone': 'TEXT', 'role': 'TEXT', 'storeName': 'TEXT', 'businessType': 'TEXT',
        'categories': 'TEXT', 'taxNumber': 'TEXT', 'address': 'TEXT', 'website': 'TEXT',
        'shippingLocations': 'TEXT', 'logo_path': 'TEXT', 'createdAt': 'DATETIME'
    }
    for col, typ in needed.items():
        if col not in existing:
            try:
                cur2.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
            except Exception:
                pass
    db2.commit()
    db2.close()
    
    # Add tags and category columns to ads table
    db3 = get_db()
    cur3 = db3.cursor()
    cur3.execute("PRAGMA table_info(ads)")
    ads_cols = [r[1] for r in cur3.fetchall()]
    ads_needed = {'category': 'TEXT', 'tags': 'TEXT'}
    for col, typ in ads_needed.items():
        if col not in ads_cols:
            try:
                cur3.execute(f"ALTER TABLE ads ADD COLUMN {col} {typ}")
            except Exception:
                pass
    db3.commit()
    db3.close()


app = Flask(__name__, static_folder=str(BASE_DIR / 'public'), static_url_path='')
CORS(app)

# Initialize DB immediately so we don't rely on server hooks that may differ across environments
init_db()


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
    storeName = form.get('storeName')
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

    # handle logo upload
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

    hashed = generate_password_hash(password)
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute('INSERT INTO users (name, email, password, phone, role, storeName, businessType, categories, taxNumber, address, website, shippingLocations, logo_path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    (name, email, hashed, phone, role, storeName, businessType, categories, taxNumber, address, website, shipping, logo_path))
        db.commit()
        user_id = cur.lastrowid
        db.close()
        return jsonify({'success': True, 'userId': user_id})
    except sqlite3.IntegrityError as e:
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
        cur = db.cursor()
        cur.execute('SELECT id, name, email, password, phone, role, storeName, businessType, categories, address, website, logo_path FROM users WHERE email = ?', (email,))
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
            'storeName': row['storeName'],
            'businessType': row['businessType'],
            'categories': row['categories'],
            'address': row['address'],
            'website': row['website'],
            'logo': row['logo_path']
        }
        return jsonify(user_data)
    except Exception as e:
        print('login error', e)
        return jsonify({'error': 'database error'}), 500


@app.route('/api/stores', methods=['GET'])
def get_stores():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT id, name, email, storeName, businessType, categories, address, website, logo_path, createdAt FROM users WHERE role = ? ORDER BY createdAt DESC LIMIT 20', ('seller',))
        rows = cur.fetchall()
        db.close()
        results = []
        for r in rows:
            results.append({
                'id': r['id'],
                'name': r['name'],
                'email': r['email'],
                'storeName': r['storeName'],
                'businessType': r['businessType'],
                'categories': r['categories'],
                'address': r['address'],
                'website': r['website'],
                'logo': r['logo_path'],
                'createdAt': r['createdAt']
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
        cur = db.cursor()
        cur.execute('SELECT ads.*, users.name AS author, users.storeName, users.role FROM ads LEFT JOIN users ON ads.userId = users.id ORDER BY createdAt DESC')
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
            
            # Safely get values with defaults
            results.append({
                'id': r['id'],
                'title': r['title'],
                'description': r['description'],
                'userId': r['userId'],
                'createdAt': r['createdAt'],
                'author': r['author'] if 'author' in row_keys else None,
                'storeName': r['storeName'] if 'storeName' in row_keys else None,
                'role': r['role'] if 'role' in row_keys else None,
                'category': category,
                'tags': tags,
                'price': r['price'] if 'price' in row_keys and r['price'] is not None else None,
                'unit': r['unit'] if 'unit' in row_keys else None,
                'minOrder': r['minOrder'] if 'minOrder' in row_keys and r['minOrder'] is not None else 1,
                'stock': r['stock'] if 'stock' in row_keys else None,
                'imageUrl': r['imageUrl'] if 'imageUrl' in row_keys else None,
                'verified': r['verified'] if 'verified' in row_keys and r['verified'] is not None else 0,
                'views': r['views'] if 'views' in row_keys and r['views'] is not None else 0
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
    
    if not title or not description:
        return jsonify({'error': 'title and description required'}), 400
    try:
        import json
        db = get_db()
        cur = db.cursor()
        tags_json = json.dumps(tags) if tags else None
        cur.execute('''INSERT INTO ads (title, description, userId, category, tags, price, unit, minOrder, stock, imageUrl) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                    (title, description, userId, category, tags_json, price, unit, minOrder, stock, imageUrl))
        db.commit()
        last = cur.lastrowid
        cur.execute('SELECT ads.*, users.name AS author, users.role FROM ads LEFT JOIN users ON ads.userId = users.id WHERE ads.id = ?', (last,))
        row = cur.fetchone()
        db.close()
        if row:
            row_keys = row.keys()
            result = {
                'id': row['id'], 'title': row['title'], 'description': row['description'], 
                'userId': row['userId'], 'createdAt': row['createdAt'], 'author': row['author'],
                'category': row['category'] if 'category' in row_keys else None,
                'tags': json.loads(row['tags']) if row['tags'] else [],
                'price': row['price'] if 'price' in row_keys else None,
                'unit': row['unit'] if 'unit' in row_keys else None,
                'minOrder': row['minOrder'] if 'minOrder' in row_keys else 1,
                'stock': row['stock'] if 'stock' in row_keys else None,
                'imageUrl': row['imageUrl'] if 'imageUrl' in row_keys else None,
                'verified': row['verified'] if 'verified' in row_keys else 0
            }
            return jsonify({'success': True, **result})
        return jsonify({'error': 'not found'}), 500
    except Exception as e:
        print('post_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/api/ads/<int:ad_id>', methods=['DELETE'])
def delete_ad(ad_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM ads WHERE id = ?', (ad_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Ad not found'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        print('delete_ad error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Serve static files from public/, fallback to index.html
    if path != '' and (BASE_DIR / 'public' / path).exists():
        return send_from_directory(str(BASE_DIR / 'public'), path)
    return send_from_directory(str(BASE_DIR / 'public'), 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)

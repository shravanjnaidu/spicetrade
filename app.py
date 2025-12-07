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
        'shippingLocations': 'TEXT', 'logo_path': 'TEXT', 'createdAt': 'DATETIME',
        'uniqueId': 'TEXT', 'location': 'TEXT', 'profilePicture': 'TEXT'
    }
    for col, typ in needed.items():
        if col not in existing:
            try:
                cur2.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
            except Exception:
                pass
    db2.commit()
    
    # Generate unique IDs for existing users without one
    cur2.execute("SELECT id FROM users WHERE uniqueId IS NULL OR uniqueId = ''")
    users_without_id = cur2.fetchall()
    for row in users_without_id:
        import uuid
        unique_id = 'ST' + str(uuid.uuid4())[:8].upper()
        cur2.execute("UPDATE users SET uniqueId = ? WHERE id = ?", (unique_id, row[0]))
    db2.commit()
    db2.close()
    
    # Add tags and category columns to ads table
    db3 = get_db()
    cur3 = db3.cursor()
    cur3.execute("PRAGMA table_info(ads)")
    ads_cols = [r[1] for r in cur3.fetchall()]
    ads_needed = {
        'category': 'TEXT', 
        'tags': 'TEXT',
        'price': 'REAL',
        'unit': 'TEXT',
        'minOrder': 'INTEGER',
        'stock': 'INTEGER',
        'imageUrl': 'TEXT',
        'verified': 'INTEGER',
        'views': 'INTEGER'
    }
    
    # Create messages table
    cur3.execute('''CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyerId INTEGER,
        sellerId INTEGER,
        listingId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(buyerId) REFERENCES users(id),
        FOREIGN KEY(sellerId) REFERENCES users(id),
        FOREIGN KEY(listingId) REFERENCES ads(id)
    )''')
    
    cur3.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER,
        senderId INTEGER,
        message TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversationId) REFERENCES conversations(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
    )''')
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


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Generic file upload endpoint for images"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Create uploads directory if it doesn't exist
        uploads_dir = BASE_DIR / 'public' / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate secure filename with timestamp
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Save file
        save_path = uploads_dir / filename
        file.save(str(save_path))
        
        # Return URL path
        url = f"/uploads/{filename}"
        return jsonify({'success': True, 'url': url})
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
        cur = db.cursor()
        cur.execute('INSERT INTO users (name, email, password, phone, role, storeName, businessType, categories, taxNumber, address, website, shippingLocations, logo_path, uniqueId, location, profilePicture) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    (name, email, hashed, phone, role, storeName, businessType, categories, taxNumber, address, website, shipping, logo_path, unique_id, location, profile_picture))
        db.commit()
        user_id = cur.lastrowid
        
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
        cur.execute('SELECT id, name, email, password, phone, role, storeName, businessType, categories, address, website, logo_path, uniqueId, location, profilePicture FROM users WHERE email = ?', (email,))
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
            'logo': row['logo_path'],
            'uniqueId': row['uniqueId'],
            'location': row['location'],
            'profilePicture': row['profilePicture']
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
        cur.execute('SELECT ads.*, users.name AS author, users.storeName, users.role, users.profilePicture FROM ads LEFT JOIN users ON ads.userId = users.id ORDER BY createdAt DESC')
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
                'profilePicture': r['profilePicture'] if 'profilePicture' in row_keys else None,
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
            updates.append('name = ?')
            params.append(data['name'])
        if 'phone' in data:
            updates.append('phone = ?')
            params.append(data['phone'])
        if 'location' in data:
            updates.append('location = ?')
            params.append(data['location'])
        if 'storeName' in data:
            updates.append('storeName = ?')
            params.append(data['storeName'])
        if 'businessType' in data:
            updates.append('businessType = ?')
            params.append(data['businessType'])
        if 'address' in data:
            updates.append('address = ?')
            params.append(data['address'])
        if profile_picture:
            updates.append('profilePicture = ?')
            params.append(profile_picture)
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(query, params)
        db.commit()
        
        # Fetch updated user data
        cursor.execute('SELECT id, name, email, phone, role, storeName, businessType, categories, address, website, logo_path, uniqueId, location, profilePicture FROM users WHERE id = ?', (user_id,))
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
            'storeName': row['storeName'],
            'businessType': row['businessType'],
            'categories': row['categories'],
            'address': row['address'],
            'website': row['website'],
            'logo': row['logo_path'],
            'uniqueId': row['uniqueId'],
            'location': row['location'],
            'profilePicture': row['profilePicture']
        }
        return jsonify(user_data)
    except Exception as e:
        print('update_profile error:', e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'database error'}), 500


# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    try:
        db = get_db()
        cursor = db.cursor()
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
                'storeName': row['storeName'],
                'businessType': row['businessType'],
                'categories': row['categories'],
                'address': row['address'],
                'website': row['website'],
                'logo': row['logo_path'],
                'uniqueId': row['uniqueId'],
                'location': row['location'],
                'profilePicture': row['profilePicture'],
                'createdAt': row['createdAt']
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
            updates.append('name = ?')
            params.append(data['name'])
        if 'email' in data:
            updates.append('email = ?')
            params.append(data['email'])
        if 'phone' in data:
            updates.append('phone = ?')
            params.append(data['phone'])
        if 'location' in data:
            updates.append('location = ?')
            params.append(data['location'])
        if 'storeName' in data:
            updates.append('storeName = ?')
            params.append(data['storeName'])
        if 'businessType' in data:
            updates.append('businessType = ?')
            params.append(data['businessType'])
        if 'address' in data:
            updates.append('address = ?')
            params.append(data['address'])
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        
        db = get_db()
        cursor = db.cursor()
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
        cursor = db.cursor()
        cursor.execute('UPDATE users SET password = ? WHERE id = ?', (hashed, user_id))
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
        cursor = db.cursor()
        
        # Delete user's ads first
        cursor.execute('DELETE FROM ads WHERE userId = ?', (user_id,))
        
        # Delete user
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
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
        cursor = db.cursor()
        
        # Check if conversation already exists
        cursor.execute('''
            SELECT id FROM conversations 
            WHERE buyerId = ? AND sellerId = ?
        ''', (buyer_id, seller_id))
        existing = cursor.fetchone()
        
        if existing:
            db.close()
            return jsonify({'success': True, 'conversationId': existing[0]})
        
        # Create new conversation
        cursor.execute('''
            INSERT INTO conversations (buyerId, sellerId, listingId)
            VALUES (?, ?, ?)
        ''', (buyer_id, seller_id, listing_id))
        db.commit()
        conversation_id = cursor.lastrowid
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
        cursor = db.cursor()
        
        # Get conversations where user is buyer or seller
        cursor.execute('''
            SELECT 
                c.id, c.buyerId, c.sellerId, c.listingId, c.createdAt,
                buyer.name as buyerName, buyer.email as buyerEmail, buyer.profilePicture as buyerPicture,
                seller.name as sellerName, seller.email as sellerEmail, seller.profilePicture as sellerPicture,
                seller.storeName,
                (SELECT message FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessage,
                (SELECT createdAt FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessageTime
            FROM conversations c
            JOIN users buyer ON c.buyerId = buyer.id
            JOIN users seller ON c.sellerId = seller.id
            WHERE c.buyerId = ? OR c.sellerId = ?
            ORDER BY c.createdAt DESC
        ''', (user_id, user_id))
        
        rows = cursor.fetchall()
        conversations = []
        for r in rows:
            conversations.append({
                'id': r[0],
                'buyerId': r[1],
                'sellerId': r[2],
                'listingId': r[3],
                'createdAt': r[4],
                'buyerName': r[5],
                'buyerEmail': r[6],
                'buyerPicture': r[7],
                'sellerName': r[8],
                'sellerEmail': r[9],
                'sellerPicture': r[10],
                'storeName': r[11],
                'lastMessage': r[12],
                'lastMessageTime': r[13]
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
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT 
                m.id, m.conversationId, m.senderId, m.message, m.createdAt,
                u.name as senderName, u.email as senderEmail, u.profilePicture
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.conversationId = ?
            ORDER BY m.createdAt ASC
        ''', (conversation_id,))
        
        rows = cursor.fetchall()
        messages = []
        for r in rows:
            messages.append({
                'id': r[0],
                'conversationId': r[1],
                'senderId': r[2],
                'message': r[3],
                'createdAt': r[4],
                'senderName': r[5],
                'senderEmail': r[6],
                'senderPicture': r[7]
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
        cursor = db.cursor()
        
        # Verify user is part of this conversation
        cursor.execute('''
            SELECT buyerId, sellerId FROM conversations WHERE id = ?
        ''', (conversation_id,))
        conv = cursor.fetchone()
        
        if not conv or (sender_id != conv[0] and sender_id != conv[1]):
            db.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Insert message
        cursor.execute('''
            INSERT INTO messages (conversationId, senderId, message)
            VALUES (?, ?, ?)
        ''', (conversation_id, sender_id, message))
        db.commit()
        message_id = cursor.lastrowid
        db.close()
        
        return jsonify({'success': True, 'messageId': message_id})
    except Exception as e:
        print('send_message error:', e)
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

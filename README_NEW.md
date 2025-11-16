# SpiceTrade - Professional B2B Marketplace

![Version 2.0](https://img.shields.io/badge/version-2.0-orange) ![Production Ready](https://img.shields.io/badge/status-production%20ready-success)

A production-grade B2B e-commerce platform connecting global buyers and suppliers in commodity trade.

---

## 🚀 Quick Start

```powershell
# Run the application
cd d:\code\trial2\spicetrade
python app.py

# Open browser at http://localhost:3000
```

---

## ✨ What's New in v2.0

### Professional E-Commerce Features

- 💰 **Pricing System**: Price per unit, MOQ, stock levels
- 📷 **Image Uploads**: Secure product photo management
- 🔍 **Advanced Search**: Real-time filtering by category, price, verification
- ✅ **Verification Badges**: Trust indicators for suppliers
- 📊 **Analytics**: View tracking and popularity metrics
- 📝 **RFQ Forms**: Request for Quote system
- 🎨 **Alibaba-Style UI**: Professional, modern design

### Technical Improvements

- Auto-migrating database (no manual SQL!)
- RESTful API with new endpoints
- Enhanced security (XSS, SQL injection protection)
- Mobile-responsive design
- Performance optimizations

---

## 📚 Documentation

- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - Complete technical documentation
- **[QUICK_START.md](QUICK_START.md)** - User guide for buyers/sellers

---

## 🎯 Key Features

| Feature              | Description                          |
| -------------------- | ------------------------------------ |
| **User Roles**       | Separate buyer and seller accounts   |
| **Store Profiles**   | Complete business information        |
| **Product Listings** | Rich cards with images, pricing, MOQ |
| **Search & Filter**  | Multi-criteria product discovery     |
| **Image Upload**     | Secure file handling                 |
| **Verification**     | Trusted supplier badges              |
| **RFQ System**       | Direct buyer-seller inquiries        |
| **Analytics**        | View counts and popularity           |

---

## 📦 Tech Stack

- **Backend**: Python Flask 3.1.2
- **Database**: SQLite (auto-migrating)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Werkzeug, password hashing, input validation

---

## 🔌 API Endpoints

```
Authentication
POST /api/signup       - Register new user
POST /api/login        - User login

Stores
GET  /api/stores       - List all stores

Products
GET  /api/ads          - List all products
POST /api/ads          - Create product listing
POST /api/ads/:id/view - Increment view counter

Uploads
POST /api/upload       - Upload product images
```

---

## 👥 For Users

### Buyers

1. Browse products with advanced filters
2. View detailed product information
3. Send RFQs to suppliers
4. Post buying requirements

### Sellers

1. Create professional store profile
2. Add products with images, pricing, MOQ
3. Manage inventory
4. Respond to buyer inquiries

---

## 🛠️ Installation

```powershell
# 1. Activate virtual environment (if using)
ENV\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run server
python app.py
```

**Requirements:**

- Flask >= 3.1.2
- flask-cors >= 6.0.1
- werkzeug >= 3.1.3

---

## 🎨 Customization

### Brand Colors

Edit `public/styles.css`:

```css
:root {
  --accent: #d35400; /* Primary orange */
  --success: #22c55e; /* Green badges */
  --info: #3b82f6; /* Blue accents */
}
```

### Categories

Edit form dropdowns in `public/dashboard.html`

---

## 📁 Project Structure

```
spicetrade/
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── IMPROVEMENTS.md       # Technical docs
├── QUICK_START.md        # User guide
├── data/
│   └── db.sqlite         # Database (auto-created)
├── public/               # Frontend
│   ├── index.html        # Home page
│   ├── dashboard.html    # Buyer dashboard
│   ├── seller-dashboard.html
│   ├── listing.html      # Product details
│   ├── app.js            # Shared JavaScript
│   ├── styles.css        # Global styles
│   └── uploads/          # Product images
└── ENV/                  # Virtual environment
```

---

## 🔒 Security

- Password hashing with werkzeug
- SQL injection prevention (parameterized queries)
- XSS protection (HTML escaping)
- File upload validation
- Secure filename sanitization

---

## 🚀 Deployment

### Production Checklist

- Set `debug=False` in app.py
- Use production WSGI server (Gunicorn)
- Enable HTTPS
- Configure database backups
- Set up monitoring

### Example with Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 app:app
```

---

## 📊 Database

### Auto-Migration

The database automatically updates schema on server start:

- Adds new columns to existing tables
- Preserves all existing data
- No manual SQL required!

### Tables

- **users**: Authentication and profiles
- **ads**: Product listings with e-commerce fields

---

## 🐛 Known Limitations

- Single image upload per product (multiple images planned)
- RFQ emails not yet implemented
- No payment gateway integration
- Basic analytics (full dashboard planned)

See `IMPROVEMENTS.md` for complete roadmap.

---

## 🔄 Version History

### Version 2.0 (January 2025) - Current

**Production-Grade Release**

- Professional UI overhaul (Alibaba-inspired)
- E-commerce features (pricing, MOQ, stock, images)
- Advanced search and filtering
- Verification system
- Analytics and view tracking
- RFQ functionality
- Enhanced security

### Version 1.0 (2024)

- Basic marketplace
- User authentication
- Simple product listings
- Tag system

---

## 📞 Support

**Documentation:**

- Technical details: `IMPROVEMENTS.md`
- User guide: `QUICK_START.md`

**Troubleshooting:**

- Check browser console for JavaScript errors
- Check terminal for server errors
- Verify database file has write permissions

---

## 👏 Credits

**© 2022-2025 Group of Spice Cloud Technologies, Canada**

Established 2022

---

## 📄 License

Proprietary software. All rights reserved.

---

**Built with Flask, SQLite, and modern web technologies**

_For a better B2B trading experience_ 🌶️

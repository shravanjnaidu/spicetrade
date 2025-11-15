```markdown
# spicetrade

Simple demo app to publish and browse ads.

Getting started (Windows PowerShell):

1. Install Node dependencies (original server)
   npm install

2. Start the Node server (original)
   npm start

3. OR run the Python/Flask server (alternative)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1 # in PowerShell
   pip install -r requirements.txt
   python app.py
   Open http://localhost:3000

Notes:

- This is a minimal, demo implementation. Passwords are hashed but there is no production-ready authentication/session management.
- Database is stored in `data/db.sqlite`.
- The project now includes a Python/Flask server (`app.py`) exposing the same API endpoints as the Node server: `/api/signup`, `/api/login`, `/api/ads` (GET/POST), and serves static files from `public/`.
```

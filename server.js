const path = require("path");
const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ensure data folder exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const dbPath = path.join(dataDir, "db.sqlite");

const db = new sqlite3.Database(dbPath);

// initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    userId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
});

// Signup
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
  );
  stmt.run(name || null, email, hashed, function (err) {
    if (err) {
      if (err.message && err.message.includes("UNIQUE"))
        return res.status(409).json({ error: "email already used" });
      return res.status(500).json({ error: "database error" });
    }
    res.json({ success: true, userId: this.lastID });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });
  db.get(
    "SELECT id, name, email, password FROM users WHERE email = ?",
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ error: "database error" });
      if (!row) return res.status(401).json({ error: "invalid credentials" });
      const ok = bcrypt.compareSync(password, row.password);
      if (!ok) return res.status(401).json({ error: "invalid credentials" });
      res.json({
        success: true,
        userId: row.id,
        name: row.name,
        email: row.email,
      });
    }
  );
});

// Get all ads
app.get("/api/ads", (req, res) => {
  db.all(
    "SELECT ads.*, users.name AS author FROM ads LEFT JOIN users ON ads.userId = users.id ORDER BY createdAt DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "database error" });
      res.json(rows);
    }
  );
});

// Post an ad
app.post("/api/ads", (req, res) => {
  const { title, description, userId } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: "title and description required" });
  const stmt = db.prepare(
    "INSERT INTO ads (title, description, userId) VALUES (?, ?, ?)"
  );
  stmt.run(title, description, userId || null, function (err) {
    if (err) return res.status(500).json({ error: "database error" });
    db.get(
      "SELECT ads.*, users.name AS author FROM ads LEFT JOIN users ON ads.userId = users.id WHERE ads.id = ?",
      [this.lastID],
      (e, row) => {
        if (e) return res.status(500).json({ error: "database error" });
        res.json(row);
      }
    );
  });
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`spicetrade server running on http://localhost:${PORT}`)
);

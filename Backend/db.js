const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'marketplace.db'));

// Initialize tables
db.serialize(() => {
  // Users table (sellers & buyers)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    condition TEXT CHECK(condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    category_id INTEGER,
    seller_id INTEGER NOT NULL,
    images TEXT, -- JSON array of image URLs
    location TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'reserved')),
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
  )`);

  // Favorites table
  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(user_id, product_id)
  )`);

  // Insert default categories
  const categories = [
    ['Electronics', '💻', '#3b82f6'],
    ['Fashion', '👕', '#ec4899'],
    ['Home & Garden', '🏠', '#10b981'],
    ['Sports', '⚽', '#f59e0b'],
    ['Books', '📚', '#8b5cf6'],
    ['Toys', '🧸', '#ef4444'],
    ['Vehicles', '🚗', '#06b6d4'],
    ['Collectibles', '💎', '#f97316'],
    ['Health & Beauty', '💄', '#d946ef'],
    ['Other', '📦', '#6b7280']
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)');
  categories.forEach(cat => insertCategory.run(cat));
  insertCategory.finalize();

  console.log('Database initialized successfully!');
});
module.exports = db;
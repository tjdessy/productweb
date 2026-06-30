const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, location } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (name, email, password, phone, location) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, location || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ 
          token, 
          user: { id: this.lastID, name, email, phone, location } 
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        location: user.location,
        avatar: user.avatar
      } 
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticate, (req, res) => {
  db.get('SELECT id, name, email, phone, location, avatar, created_at FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    }
  );
});

// ==================== CATEGORY ROUTES ====================

app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==================== PRODUCT ROUTES ====================

// Get all products (with filters)
app.get('/api/products', (req, res) => {
  const { category, search, minPrice, maxPrice, condition, location, sort, page = 1, limit = 12 } = req.query;
  
  let query = `
    SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           u.name as seller_name, u.phone as seller_phone, u.location as seller_location, u.avatar as seller_avatar
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active'
  `;
  
  const params = [];
  
  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }
  
  if (search) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (minPrice) {
    query += ' AND p.price >= ?';
    params.push(minPrice);
  }
  
  if (maxPrice) {
    query += ' AND p.price <= ?';
    params.push(maxPrice);
  }
  
  if (condition) {
    query += ' AND p.condition = ?';
    params.push(condition);
  }
  
  if (location) {
    query += ' AND p.location LIKE ?';
    params.push(`%${location}%`);
  }
  
  // Sorting
  switch (sort) {
    case 'price_asc': query += ' ORDER BY p.price ASC'; break;
    case 'price_desc': query += ' ORDER BY p.price DESC'; break;
    case 'oldest': query += ' ORDER BY p.created_at ASC'; break;
    case 'popular': query += ' ORDER BY p.views DESC'; break;
    default: query += ' ORDER BY p.created_at DESC'; break;
  }
  
  // Pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse images JSON
    const products = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price)
    }));
    
    res.json({ products, page: parseInt(page), limit: parseInt(limit) });
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  // Increment views
  db.run('UPDATE products SET views = views + 1 WHERE id = ?', [id]);
  
  db.get(`
    SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           u.name as seller_name, u.phone as seller_phone, u.location as seller_location, u.avatar as seller_avatar, u.email as seller_email, u.created_at as seller_since
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    
    res.json({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price),
      seller_since: row.seller_since
    });
  });
});

// Create product
app.post('/api/products', authenticate, upload.array('images', 5), (req, res) => {
  const { title, description, price, condition, category_id, location } = req.body;
  
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }
  
  const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  
  db.run(
    'INSERT INTO products (title, description, price, condition, category_id, seller_id, images, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description || null, price, condition || 'good', category_id || null, req.user.id, JSON.stringify(imageUrls), location || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get(`
        SELECT p.*, c.name as category_name, u.name as seller_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.id = ?
      `, [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          ...row,
          images: row.images ? JSON.parse(row.images) : [],
          price: parseFloat(row.price)
        });
      });
    }
  );
});

// Update product
app.put('/api/products/:id', authenticate, upload.array('images', 5), (req, res) => {
  const { id } = req.params;
  const { title, description, price, condition, category_id, location, status } = req.body;
  
  // Check ownership
  db.get('SELECT seller_id, images FROM products WHERE id = ?', [id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    
    let imageUrls = product.images ? JSON.parse(product.images) : [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(f => `/uploads/${f.filename}`);
    }
    
    db.run(
      'UPDATE products SET title = ?, description = ?, price = ?, condition = ?, category_id = ?, images = ?, location = ?, status = ? WHERE id = ?',
      [title, description || null, price, condition || 'good', category_id || null, JSON.stringify(imageUrls), location || null, status || 'active', id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product updated successfully' });
      }
    );
  });
});

// Delete product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT seller_id FROM products WHERE id = ?', [id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product deleted successfully' });
    });
  });
});

// Get seller's products
app.get('/api/seller/products', authenticate, (req, res) => {
  db.all(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.seller_id = ?
    ORDER BY p.created_at DESC
  `, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const products = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price)
    }));
    
    res.json(products);
  });
});

// Get products by seller ID (public)
app.get('/api/seller/:id/products', (req, res) => {
  const { id } = req.params;
  
  db.all(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.seller_id = ? AND p.status = 'active'
    ORDER BY p.created_at DESC
  `, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const products = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price)
    }));
    
    res.json(products);
  });
});

// ==================== FAVORITES ROUTES ====================

app.get('/api/favorites', authenticate, (req, res) => {
  db.all(`
    SELECT p.*, c.name as category_name, u.name as seller_name
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE f.user_id = ? AND p.status = 'active'
    ORDER BY f.created_at DESC
  `, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const products = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price)
    }));
    
    res.json(products);
  });
});

app.post('/api/favorites/:productId', authenticate, (req, res) => {
  const { productId } = req.params;
  
  db.run('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)', 
    [req.user.id, productId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Added to favorites' });
    }
  );
});

app.delete('/api/favorites/:productId', authenticate, (req, res) => {
  const { productId } = req.params;
  
  db.run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', 
    [req.user.id, productId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Removed from favorites' });
    }
  );
});

// ==================== STATS ====================

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total_products FROM products WHERE status = "active"', [], (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT COUNT(*) as total_users FROM users', [], (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get('SELECT COUNT(*) as total_categories FROM categories', [], (err, categories) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
          total_products: products.total_products,
          total_users: users.total_users,
          total_categories: categories.total_categories
        });
      });
    });
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

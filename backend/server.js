// server.js - Express.js Backend Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const db = new sqlite3.Database('./ecommerce.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create Tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Order Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Insert sample products
  const sampleProducts = [
    ['Wireless Headphones', 'Premium noise-cancelling wireless headphones', 79.99, 15, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
    ['Smart Watch', 'Fitness tracking smartwatch with heart rate monitor', 199.99, 8, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
    ['Leather Backpack', 'Handcrafted leather backpack with laptop compartment', 89.99, 12, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'],
    ['Running Shoes', 'Lightweight running shoes with cushioned sole', 129.99, 20, 'Footwear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
    ['Coffee Maker', 'Programmable coffee maker with thermal carafe', 149.99, 10, 'Home', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'],
    ['Yoga Mat', 'Non-slip yoga mat with carrying strap', 34.99, 25, 'Fitness', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f']
  ];

  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)');
      sampleProducts.forEach(product => stmt.run(product));
      stmt.finalize();
      console.log('Sample products inserted');
    }
  });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, name, email } });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  });
});

// ============ PRODUCT ROUTES ============

// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(products);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });
});

// ============ ORDER ROUTES ============

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  const { items, total } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
    [userId, total, 'Processing'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const orderId = this.lastID;
      const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

      items.forEach(item => {
        stmt.run([orderId, item.id, item.quantity, item.price]);
      });

      stmt.finalize();

      res.json({ 
        message: 'Order placed successfully', 
        orderId,
        order: { id: orderId, total, status: 'Processing' }
      });
    }
  );
});

// Get user orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT o.*, 
            GROUP_CONCAT(oi.product_id) as product_ids,
            GROUP_CONCAT(oi.quantity) as quantities,
            GROUP_CONCAT(oi.price) as prices
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) return res.status(500).json({ error: err.message });

      // Format orders with items
      const formattedOrders = orders.map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        date: order.created_at,
        items: order.product_ids ? order.product_ids.split(',').map((id, idx) => ({
          product_id: id,
          quantity: order.quantities.split(',')[idx],
          price: order.prices.split(',')[idx]
        })) : []
      }));

      res.json(formattedOrders);
    }
  );
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
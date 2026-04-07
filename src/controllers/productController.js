const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, stock, min_stock } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, stock, min_stock) VALUES (?, ?, ?)',
      [name, stock || 0, min_stock || 0]
    );
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

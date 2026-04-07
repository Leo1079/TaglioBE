const pool = require('../config/db');

exports.registerMovement = async (req, res) => {
  try {
    const { product_id, type, quantity, reason } = req.body;
    
    // Start transaction since we'll insert a movement and update the stock
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create movement
      await connection.query(
        'INSERT INTO inventory_movements (product_id, type, quantity, reason, created_at) VALUES (?, ?, ?, ?, NOW())',
        [product_id, type, quantity, reason]
      );

      // Update product stock
      const multiplier = type === 'in' ? 1 : -1;
      await connection.query(
        'UPDATE products SET stock = stock + (?) WHERE id = ?',
        [quantity * multiplier, product_id]
      );

      await connection.commit();
      res.status(201).json({ message: 'Movement registered successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

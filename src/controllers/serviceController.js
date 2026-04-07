const pool = require('../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services ORDER BY name ASC');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addService = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const [result] = await pool.query('INSERT INTO services (name, price) VALUES (?, ?)', [name, price]);
    res.status(201).json({ id: result.insertId, name, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    if (price === undefined) {
      return res.status(400).json({ error: 'Price is required for update' });
    }

    await pool.query('UPDATE services SET price = ? WHERE id = ?', [price, id]);
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

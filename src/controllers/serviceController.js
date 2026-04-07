const pool = require('../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services ORDER BY name ASC');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

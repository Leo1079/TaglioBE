const pool = require('../config/db');


exports.createHaircut = async (req, res) => {
  try {
    const { service_id, metodo_pago } = req.body;
    
    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required' });
    }
    const payMethod = metodo_pago || 'efectivo';

    // Check for open cash register
    const [register] = await pool.query('SELECT id FROM cash_registers WHERE status = "open"');
    if (register.length === 0) {
      return res.status(400).json({ error: 'You need an open cash register first to process a haircut' });
    }
    const cash_register_id = register[0].id;

    // Fetch the preset price from the services table directly to prevent frontend tampering
    const [service] = await pool.query('SELECT price FROM services WHERE id = ?', [service_id]);
    if (service.length === 0) {
      return res.status(404).json({ error: 'Service not found in the database. Are you sure that service exists?' });
    }
    
    const finalPrice = service[0].price;

    const [result] = await pool.query(
      'INSERT INTO haircuts (service_id, cash_register_id, price, metodo_pago, created_at) VALUES (?, ?, ?, ?, NOW())',
      [service_id, cash_register_id, finalPrice, payMethod]
    );

    res.status(201).json({ message: 'Haircut registered', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getHaircuts = async (req, res) => {
  try {
    const [haircuts] = await pool.query(`
      SELECT h.*, s.name as service_name 
      FROM haircuts h
      LEFT JOIN services s ON h.service_id = s.id
      ORDER BY h.created_at DESC
      LIMIT 100
    `);
    res.json(haircuts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

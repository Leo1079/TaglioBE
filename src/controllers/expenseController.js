const pool = require('../config/db');

exports.createExpense = async (req, res) => {
  try {
    const { description, amount } = req.body;
    
    const [register] = await pool.query('SELECT id FROM cash_registers WHERE status = "open"');
    if (register.length === 0) {
      return res.status(400).json({ error: 'You need an open cash register first' });
    }
    const cash_register_id = register[0].id;

    const [result] = await pool.query(
      'INSERT INTO expenses (cash_register_id, description, amount, created_at) VALUES (?, ?, ?, NOW())',
      [cash_register_id, description, amount]
    );

    res.status(201).json({ message: 'Expense registered', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const [expenses] = await pool.query('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 100');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

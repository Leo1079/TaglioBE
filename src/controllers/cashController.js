const pool = require('../config/db');

// POST /api/cash/open
exports.openCash = async (req, res) => {
  try {
    const { initial_amount } = req.body;
    
    // Check if there is already an open cash register
    const [existing] = await pool.query('SELECT * FROM cash_registers WHERE status = "open"');
    if (existing.length > 0) {
      return res.status(400).json({ error: 'There is already an open cash register' });
    }

    const [result] = await pool.query(
      'INSERT INTO cash_registers (initial_amount, status, opened_at) VALUES (?, "open", NOW())',
      [initial_amount || 0]
    );

    res.status(201).json({ message: 'Cash register opened', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/cash/close
exports.closeCash = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM cash_registers WHERE status = "open"');
    if (existing.length === 0) {
      return res.status(400).json({ error: 'No open cash register found' });
    }

    const cashRegisterId = existing[0].id;
    
    await pool.query(
      'UPDATE cash_registers SET status = "closed", closed_at = NOW() WHERE id = ?',
      [cashRegisterId]
    );

    res.json({ message: 'Cash register closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/cash/current
exports.getCurrentCash = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM cash_registers WHERE status = "open"');
    if (existing.length === 0) {
      return res.json({ status: 'closed', data: null });
    }

    const register = existing[0];

    // Get today's incomes from this register
    const [haircuts] = await pool.query(
      'SELECT SUM(price) as total_income FROM haircuts WHERE cash_register_id = ?',
      [register.id]
    );
    
    const [expenses] = await pool.query(
      'SELECT SUM(amount) as total_expense FROM expenses WHERE cash_register_id = ?',
      [register.id]
    );

    const totalIncome = Number(haircuts[0].total_income || 0);
    const totalExpense = Number(expenses[0].total_expense || 0);
    const balance = Number(register.initial_amount) + totalIncome - totalExpense;

    res.json({
      status: 'open',
      data: {
        ...register,
        total_income: totalIncome,
        total_expense: totalExpense,
        current_balance: balance
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/cash/history
exports.getHistory = async (req, res) => {
  try {
    const [history] = await pool.query(`
      SELECT 
        c.id, 
        c.opened_at, 
        c.closed_at, 
        c.initial_amount, 
        c.status,
        (SELECT COALESCE(SUM(price), 0) FROM haircuts WHERE cash_register_id = c.id) as total_income,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE cash_register_id = c.id) as total_expense
      FROM cash_registers c
      ORDER BY c.opened_at DESC
    `);

    // Calculate balance in JS or SQL. SQL is fine but since it's asked in JS logic we can just map it here to be explicit
    const processedHistory = history.map(item => {
      const initial = Number(item.initial_amount) || 0;
      const income = Number(item.total_income) || 0;
      const expense = Number(item.total_expense) || 0;
      return {
        ...item,
        initial_amount: initial,
        total_income: income,
        total_expense: expense,
        balance: initial + income - expense
      };
    });

    res.json(processedHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

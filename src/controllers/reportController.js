const pool = require('../config/db');

exports.getDailyReport = async (req, res) => {
  try {
    const [haircuts] = await pool.query('SELECT SUM(price) as total_income, COUNT(id) as total_haircuts FROM haircuts WHERE DATE(created_at) = CURDATE()');
    const [expenses] = await pool.query('SELECT SUM(amount) as total_expense FROM expenses WHERE DATE(created_at) = CURDATE()');

    const income = Number(haircuts[0].total_income || 0);
    const expense = Number(expenses[0].total_expense || 0);

    res.json({
      date: new Date().toISOString().split('T')[0],
      total_income: income,
      total_expense: expense,
      balance: income - expense,
      total_haircuts: Number(haircuts[0].total_haircuts || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroupedData = async (intervalDays) => {
  const [haircuts] = await pool.query(`
    SELECT DATE(created_at) as date, SUM(price) as income, COUNT(id) as count 
    FROM haircuts 
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [intervalDays]);

  const [expenses] = await pool.query(`
    SELECT DATE(created_at) as date, SUM(amount) as expense 
    FROM expenses 
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [intervalDays]);

  // Merge by date
  const map = {};
  
  // Fill default format for the past `intervalDays` days
  for(let i=intervalDays-1; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    map[dateStr] = { date: dateStr, income: 0, expense: 0, count: 0, balance: 0 };
  }

  haircuts.forEach(h => {
    // Format the date properly depending on mysql timezone
    const dateStr = new Date(h.date).toISOString().split('T')[0];
    if (map[dateStr]) {
      map[dateStr].income = Number(h.income) || 0;
      map[dateStr].count = Number(h.count) || 0;
    }
  });

  expenses.forEach(e => {
    const dateStr = new Date(e.date).toISOString().split('T')[0];
    if (map[dateStr]) {
      map[dateStr].expense = Number(e.expense) || 0;
    }
  });

  let total_income = 0;
  let total_expense = 0;
  let total_haircuts = 0;

  const chartData = Object.values(map).map(day => {
    day.balance = day.income - day.expense;
    total_income += day.income;
    total_expense += day.expense;
    total_haircuts += day.count;
    // Format date for chart (MM-DD)
    day.label = day.date.substring(5);
    return day;
  });

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    total_haircuts,
    chartData
  };
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const data = await getGroupedData(7);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const data = await getGroupedData(30);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

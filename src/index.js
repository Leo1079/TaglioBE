const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Main Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Import Routes
const cashRoutes = require('./routes/cash');
const haircutRoutes = require('./routes/haircuts');
const expenseRoutes = require('./routes/expenses');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const serviceRoutes = require('./routes/services'); // NEW

// Apply Routes
app.use('/api/cash', cashRoutes);
app.use('/api/haircuts', haircutRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes); // NEW

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

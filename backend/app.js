const express = require('express');
const cors = require('cors');
const path = require('path');

const products = require('./routes/product');
const users = require('./routes/user');
const orders = require('./routes/order');
const carts = require('./routes/cart');
const dashboard = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1', products);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', carts);
app.use('/api/v1', dashboard);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Jordan Brand Store API is running' });
});

module.exports = app;

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Read JSON data from requests

// Use routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('✅ Freelance Marketplace Backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
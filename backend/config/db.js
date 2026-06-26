const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'freelance_marketplace_system',
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL successfully');
});

module.exports = db;
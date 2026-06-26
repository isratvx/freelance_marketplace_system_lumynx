const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// --------------------------
// Register new user
// --------------------------
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Check if email already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], async (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password securely
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Insert new user into database
      const insertUser = "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)";
      db.query(insertUser, [full_name, email, password_hash, role], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Create empty profile record for the new user
        const insertProfile = "INSERT INTO profiles (user_id) VALUES (?)";
        db.query(insertProfile, [result.insertId]);

        res.status(201).json({ message: "User registered successfully" });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------
// Login user
// --------------------------
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const loginQuery = "SELECT * FROM users WHERE email = ?";
  db.query(loginQuery, [email], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data with correct field name ✅
    res.json({
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;
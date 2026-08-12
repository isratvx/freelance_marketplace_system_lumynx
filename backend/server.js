const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// ROUTES
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const proposalRoutes = require('./routes/proposals');
const adminRoutes = require('./routes/admin');

const app = express();

const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// BODY PARSING
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

// PUBLIC UPLOADS
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// ENSURE PROFILE UPLOAD FOLDER EXISTS
const uploadDir = path.join(
  __dirname,
  'uploads',
  'profiles'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true
    }
  );
}

// REGISTER ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    message:
      'API endpoint not found: ' +
      req.method +
      ' ' +
      req.originalUrl
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(
    `✅ Backend running on http://localhost:${PORT}`
  );
});
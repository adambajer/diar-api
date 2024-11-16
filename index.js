// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Optional: Only if using environment variables

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const notesRouter = require('./routes/notes');

// Use the notes router for /notes path
app.use('/notes', notesRouter);

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

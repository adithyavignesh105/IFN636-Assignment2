require('dotenv').config();

const express = require("express");
const cors = require("cors");

const app = require('./app');
const Database = require('./config/db');

// Start server and connect to database
const PORT = process.env.PORT || 5000;
Database.connect(process.env.MONGO_URI || "mongodb://localhost:27017/leave_shift_db")
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("Database connection failed", err);
    process.exit(1);
  });

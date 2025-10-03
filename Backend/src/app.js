const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const userRoutes = require('./routes/userRoutes');

// Express application setup (MVC Controller as routes, no view engine since it's a REST API)
const app = express();
app.use(cors());
app.use(express.json());  // parse JSON bodies

// Routes (RESTful endpoints per Week8 best practices: nouns and proper HTTP verbs)
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', userRoutes);

// Basic health check endpoint
app.get('/api/health', (req, res) => res.send('API is running'));

// Export app (do not listen here, so we can use it in tests)
module.exports = app;

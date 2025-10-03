const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Public routes for authentication
router.post('/login', authController.login);
router.post('/register', authController.register); // (Registration can be restricted by role in controller if needed)
router.post('/', (req, res) => authController.login(req, res));
module.exports = router;

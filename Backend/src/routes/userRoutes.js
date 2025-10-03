//import { listUsersLite } from '../controllers/userController.js';
const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const router = express.Router();

router.use(authMiddleware);
// router.get('/lite', protect, listUsersLite);

// Only Man                                                                                                                                                                                                                                                                                                                                                 ager can list all users
router.get('/', authorizeRoles("Manager","Employee","TeamLead"), userController.listUsers);

module.exports = router;

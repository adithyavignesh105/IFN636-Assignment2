const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const shiftController = require('../controllers/shiftController');
const router = express.Router();

// All shift routes require authenticated user
router.use(authMiddleware);

// Manager-only route to assign shifts
router.post('/assign', authorizeRoles("Manager"), shiftController.assignShift);

// Get shifts (managers get all, others get own)
router.get('/', shiftController.listShifts);

// Swap-related endpoints
router.post('/swap', shiftController.proposeSwap); // employee proposes swap (auth required, any role, but controller restricts to own shift)
router.patch('/swap/:id/accept', shiftController.acceptSwap); // target employee accepts swap
router.patch('/swap/:id/approve', authorizeRoles("Manager"), shiftController.approveSwap); // manager approves swap
router.get('/swap-requests', authorizeRoles("Manager", "TeamLead"), shiftController.listSwapRequests);

module.exports = router;

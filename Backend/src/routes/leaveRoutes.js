const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const leaveController = require('../controllers/leaveController');
const router = express.Router();

router.use(authMiddleware);

// Employee request leave
router.post('/', authorizeRoles("Employee", "TeamLead", "Manager"), leaveController.requestLeave);
// Team Lead approves (first level)
router.patch('/:id/approve-teamlead', authorizeRoles("TeamLead"), leaveController.approveLeaveTeamLead);
// Manager approves (final)
router.patch('/:id/approve-manager', authorizeRoles("Manager"), leaveController.approveLeaveManager);
// Both TeamLead and Manager can reject
router.patch('/:id/reject', authorizeRoles("TeamLead", "Manager"), leaveController.rejectLeave);
// List leave requests
router.get('/', leaveController.listLeaves);

module.exports = router;

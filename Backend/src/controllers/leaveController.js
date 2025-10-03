const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../services/NotificationService');

module.exports = {
  /** Employee requests leave */
  async requestLeave(req, res) {
    try {
      const { startDate, endDate, reason } = req.body;
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: "Please provide startDate, endDate, and reason" });
      }
      const leave = new LeaveRequest({
        user: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "PENDING"
      });
      await leave.save();
      return res.status(201).json({ message: "Leave requested", leave });
    } catch (err) {
      console.error("RequestLeave error:", err);
      res.status(500).json({ message: "Server error requesting leave" });
    }
  },

  /** Team Lead approves a leave request (first level approval) */
  async approveLeaveTeamLead(req, res) {
    try {
      const leaveId = req.params.id;
      const leave = await LeaveRequest.findById(leaveId);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      if (leave.status !== "PENDING") {
        return res.status(400).json({ message: "Leave request is not pending approval" });
      }
      // Only team lead can approve here (checked by middleware)
      leave.status = "TL_APPROVED";
      leave.teamLeadApprover = req.user.id;
      await leave.save();
      return res.json({ message: "Leave approved by Team Lead, pending Manager approval", leave });
    } catch (err) {
      console.error("TL Approve Leave error:", err);
      res.status(500).json({ message: "Server error approving leave" });
    }
  },

  /** Manager approves a leave request (final approval after team lead) */
  async approveLeaveManager(req, res) {
    try {
      const leaveId = req.params.id;
      // Find leave and ensure it was team lead approved already (or if bypassing TL, allow direct manager approval of pending)
      const leave = await LeaveRequest.findById(leaveId);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      if (leave.status !== "TL_APPROVED" && leave.status !== "PENDING") {
        return res.status(400).json({ message: "Leave request is not awaiting manager approval" });
      }
      leave.status = "APPROVED";
      leave.managerApprover = req.user.id;
      await leave.save();
      // Emit an event to notify user (Observer pattern in action)
      notificationService.emit('leaveApproved', leave);
      return res.json({ message: "Leave fully approved by Manager", leave });
    } catch (err) {
      console.error("Manager Approve Leave error:", err);
      res.status(500).json({ message: "Server error approving leave" });
    }
  },

  /** Manager or Team Lead rejects a leave request */
  async rejectLeave(req, res) {
    try {
      const leaveId = req.params.id;
      const leave = await LeaveRequest.findById(leaveId);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      if (leave.status === "APPROVED" || leave.status === "REJECTED") {
        return res.status(400).json({ message: "Leave request is already finalized" });
      }
      leave.status = "REJECTED";
      // Could record who rejected (team lead vs manager) if needed
      await leave.save();
      return res.json({ message: "Leave request rejected", leave });
    } catch (err) {
      console.error("Reject Leave error:", err);
      res.status(500).json({ message: "Server error rejecting leave" });
    }
  },

  /** List leave requests:
   * - Managers see all leave requests.
   * - Team Leads see all leave requests (or could be filtered to their team if team info was tracked).
   * - Employees see only their own leave requests.
   */
  async listLeaves(req, res) {
    try {
      let leaves;
      if (req.user.role === "Manager" || req.user.role === "TeamLead") {
        leaves = await LeaveRequest.find().populate('user', 'name role');
      } else {
        leaves = await LeaveRequest.find({ user: req.user.id }).populate('user', 'name role');
      }
      return res.json(leaves);
    } catch (err) {
      console.error("ListLeaves error:", err);
      res.status(500).json({ message: "Server error fetching leave requests" });
    }
  }
};

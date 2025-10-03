const Shift = require('../models/Shift');
const SwapRequest = require('../models/SwapRequest');

// Controller for shift assignments and swap proposals
module.exports = {
  /** Manager assigns a user to a shift on a specific date */
  async assignShift(req, res) {
    try {
      const { userId, date } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }
      const shift = new Shift({ assignedTo: userId, date: new Date(date) });
      await shift.save();
      return res.status(201).json({ message: "Shift assigned successfully", shift });
    } catch (err) {
      console.error("AssignShift error:", err);
      res.status(500).json({ message: "Server error assigning shift" });
    }
  },

  /** Get shifts - if manager, all shifts; if employee, only their shifts */
  async listShifts(req, res) {
    try {
      let shifts;
      if (req.user.role === "Manager") {
        shifts = await Shift.find().populate('assignedTo', 'name role');
      } else {
        // Employees/TeamLeads get only their own shifts
        shifts = await Shift.find({ assignedTo: req.user.id }).populate('assignedTo', 'name role');
      }
      return res.json(shifts);
    } catch (err) {
      console.error("ListShifts error:", err);
      res.status(500).json({ message: "Server error fetching shifts" });
    }
  },

  /** Employee initiates a shift swap request with a target colleague's shift */
  async proposeSwap(req, res) {
    try {
      const { targetUserId, myShiftId, targetShiftId } = req.body;
      if (!targetUserId || !myShiftId || !targetShiftId) {
        return res.status(400).json({ message: "Missing swap proposal fields" });
      }
      // Ensure the shift the employee wants to swap belongs to them:
      const myShift = await Shift.findById(myShiftId);
      if (!myShift || String(myShift.assignedTo) !== req.user.id) {
        return res.status(400).json({ message: "You can only swap your own shift" });
      }
      // Ensure the target shift belongs to target user:
      const targetShift = await Shift.findById(targetShiftId);
      if (!targetShift || String(targetShift.assignedTo) !== targetUserId) {
        return res.status(400).json({ message: "Target shift does not belong to specified user" });
      }
      // Create swap request
      const swapReq = new SwapRequest({
        initiator: req.user.id,
        target: targetUserId,
        initiatorShift: myShiftId,
        targetShift: targetShiftId,
        status: "PENDING_PEER"
      });
      await swapReq.save();
      return res.status(201).json({ message: "Swap request created, awaiting other employee's acceptance", swapRequest: swapReq });
    } catch (err) {
      console.error("ProposeSwap error:", err);
      res.status(500).json({ message: "Server error creating swap request" });
    }
  },

  /** Target employee accepts a swap proposal */
  async acceptSwap(req, res) {
    try {
      const swapId = req.params.id;
      const swap = await SwapRequest.findById(swapId);
      if (!swap) return res.status(404).json({ message: "Swap request not found" });
      if (swap.status !== "PENDING_PEER") {
        return res.status(400).json({ message: "Swap request is not awaiting peer approval" });
      }
      // Only the target user can accept the swap
      if (String(swap.target) !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to respond to this swap" });
      }
      swap.status = "PENDING_MANAGER";
      await swap.save();
      return res.json({ message: "Swap accepted. Awaiting manager approval", swap });
    } catch (err) {
      console.error("AcceptSwap error:", err);
      res.status(500).json({ message: "Server error accepting swap" });
    }
  },

  /** Manager approves a fully accepted swap */
  async approveSwap(req, res) {
    try {
      const swapId = req.params.id;
      const swap = await SwapRequest.findById(swapId);
      if (!swap) return res.status(404).json({ message: "Swap request not found" });
      if (swap.status !== "PENDING_MANAGER") {
        return res.status(400).json({ message: "Swap request is not awaiting manager approval" });
      }
      // Only manager can approve (auth middleware already ensures manager role here)
      swap.status = "APPROVED";
      swap.managerApprover = req.user.id;
      await swap.save();
      // On approval, perform the swap: exchange the assigned users in the shifts
      const [shiftA, shiftB] = await Promise.all([
        Shift.findById(swap.initiatorShift),
        Shift.findById(swap.targetShift)
      ]);
      if (shiftA && shiftB) {
        const tempUser = shiftA.assignedTo;
        shiftA.assignedTo = shiftB.assignedTo;
        shiftB.assignedTo = tempUser;
        await shiftA.save();
        await shiftB.save();
      }
      return res.json({ message: "Swap approved and shifts reassigned", swap });
    } catch (err) {
      console.error("ApproveSwap error:", err);
      res.status(500).json({ message: "Server error approving swap" });
    }
  },

  /** Manager or Team Lead can view all pending swap requests (for approval monitoring) */
  async listSwapRequests(req, res) {
    try {
      const swaps = await SwapRequest.find().populate('initiator target initiatorShift targetShift');
      return res.json(swaps);
    } catch (err) {
      console.error("ListSwapRequests error:", err);
      res.status(500).json({ message: "Server error fetching swap requests" });
    }
  }
};

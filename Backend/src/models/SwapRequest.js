const mongoose = require('mongoose');

// Swap request schema for shift swap proposals between two employees
const SwapRequestSchema = new mongoose.Schema({
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },    // who proposes the swap
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },       // the colleague to swap with
  initiatorShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  targetShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  status: { 
    type: String, 
    enum: ["PENDING_PEER", "PENDING_MANAGER", "APPROVED", "REJECTED_PEER", "REJECTED_MANAGER"], 
    default: "PENDING_PEER" 
  },
  managerApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);

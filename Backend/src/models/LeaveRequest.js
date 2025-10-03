const mongoose = require('mongoose');

// Leave request schema with approval workflow fields
const LeaveRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },      // requesting employee
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["PENDING", "TL_APPROVED", "APPROVED", "REJECTED"], 
    default: "PENDING" 
  },
  teamLeadApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  managerApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  // (Could also store timestamps for approvals)
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);

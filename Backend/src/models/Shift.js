const mongoose = require('mongoose');

// Shift schema: represents an assigned shift for a user on a given date (and time slot if needed)
const ShiftSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Optionally, could include shift timing or type (morning, night, etc.)
});

module.exports = mongoose.model('Shift', ShiftSchema);

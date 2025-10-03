class AssignShiftCommand {
  constructor({ ShiftModel, userId, date }) {
    this.ShiftModel = ShiftModel; this.userId = userId; this.date = date;
  }
  async execute(){
    const shift = new this.ShiftModel({ assignedTo: this.userId, date: new Date(this.date) });
    await shift.save();
    return shift;
  }
}
module.exports = AssignShiftCommand;

// backend/src/controllers/shiftController.js (excerpt)
const AssignShiftCommand = require('../commands/AssignShiftCommand');
async function assignShift(req,res){
  try{
    const cmd = new AssignShiftCommand({ ShiftModel: require('../models/Shift'), userId: req.body.userId, date: req.body.date });
    const shift = await cmd.execute();
    res.status(201).json({ message:"Shift assigned successfully", shift });
  } catch(e){ res.status(500).json({message:"Server error assigning shift"}); }
}
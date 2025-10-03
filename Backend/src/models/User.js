const mongoose = require('mongoose');

// Define roles for access control
const Roles = { EMPLOYEE: "Employee", TEAM_LEAD: "TeamLead", MANAGER: "Manager" };

// User schema with role-based access
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // store hashed password
  role: { type: String, enum: Object.values(Roles), required: true }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Roles
};

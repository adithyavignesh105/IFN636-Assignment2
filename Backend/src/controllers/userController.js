const { User } = require('../models/User');

// Controller for user-related endpoints (e.g., listing users for managers)
module.exports = {
  /** List all users (for manager use, e.g., to assign shifts or view team) */
  async listUsers(req, res) {
    try {
      const users = await User.find({}, '-passwordHash'); // get all users without password field
      return res.json(users);
    } catch (err) {
      console.error("ListUsers error:", err);
      res.status(500).json({ message: "Server error fetching users" });
    }
  }
};

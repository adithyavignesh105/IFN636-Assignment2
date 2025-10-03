const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Roles } = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || "DEV_JWT_SECRET";

// Controller for authentication (login, optionally registration)
module.exports = {
  /** Login: verify credentials and return JWT */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      // Check password hash
      const validPass = bcrypt.compareSync(password, user.passwordHash);
      if (!validPass) return res.status(400).json({ message: "Invalid email or password" });
      // Create JWT token with user id and role
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error during login" });
    }
  },

  /** (Optional) Registration: create new user (accessible by managers or initial setup) */
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!Object.values(Roles).includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      const hash = bcrypt.hashSync(password, 10);
      const newUser = new User({ name, email, passwordHash: hash, role });
      await newUser.save();
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
};

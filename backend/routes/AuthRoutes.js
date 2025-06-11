const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

const router = express.Router();

// Debugging: Check if this file is loaded
console.log("✅ Auth routes loaded");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
  
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Access denied, no token provided" });
    }
  
    try {
      const tokenParts = token.split(" ");
      if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        console.log("❌ Invalid token format:", token);
        return res.status(400).json({ error: "Invalid token format" });
      }
  
      const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);
      req.user = decoded;
      console.log("✅ Token verified:", decoded);
      next();
    } catch (error) {
      console.log("❌ JWT Verification Error:", error.message);
      res.status(400).json({ error: "Invalid Token" });
    }
  };
  

// Register Route
router.post("/register", async (req, res) => {
  console.log("🔹 Register endpoint hit");

  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
  }

  try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          console.log("❌ User already exists:", username);
          return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // Force role to be "User" for all new registrations
      const newUser = new User({ 
          username, 
          password: hashedPassword, 
          role: "User" // Override any role provided in request
      });

      await newUser.save();
      console.log("✅ User registered:", username, "Role:", newUser.role);

      // ✅ Send the created user in the response
      res.status(201).json({ message: "User registered successfully", newUser });
  } catch (error) {
      console.error("❌ Error registering user:", error);
      res.status(500).json({ error: "Error registering user" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  console.log("🔹 Login endpoint hit"); // Check if this is logged

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid Username or Password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for:", username);

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ✅ Protected Route: Profile
router.get("/profile", verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });
  
      res.json({ message: "Welcome to your profile", user });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // ✅ Route to get all users (Admin only)
router.get("/users", verifyToken, async (req, res) => {
  try {
      if (req.user.role !== "Admin") {
          return res.status(403).json({ error: "Access denied" });
      }
      const users = await User.find().select("-password"); // Exclude password from response
      res.json(users);
  } catch (error) {
      console.error("❌ Error fetching users:", error);
      res.status(500).json({ error: "Server error" });
  }
});

// ✅ Edit user (Admin only)
router.put("/users/:id", verifyToken, async (req, res) => {
  try {
      if (req.user.role !== "Admin") {
          return res.status(403).json({ error: "Access denied" });
      }

      const { username, password, role } = req.body;
      let updatedData = { username, role };

      if (password) {
          updatedData.password = await bcrypt.hash(password, 10);
      }

      const user = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });
      res.json(user);
  } catch (error) {
      console.error("❌ Error updating user:", error);
      res.status(500).json({ error: "Server error" });
  }
});

// ✅ Delete user (Admin only)
router.delete("/users/:id", verifyToken, async (req, res) => {
  try {
      if (req.user.role !== "Admin") {
          return res.status(403).json({ error: "Access denied" });
      }

      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted successfully" });
  } catch (error) {
      console.error("❌ Error deleting user:", error);
      res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

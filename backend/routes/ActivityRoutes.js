// backend/routes/ActivityRoutes.js
const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");

// GET all activity logs
router.get("/", async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }); // latest first
    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// ✅ ADD THIS POST ROUTE:
router.post("/log", async (req, res) => {
  try {
    console.log("Received request to log activity:", req.body); // Log the incoming request

    const { username, role, action, branch, details } = req.body;

    const newLog = new ActivityLog({
      username,
      role,
      action,
      branch,
      details, // Add details if you want them saved
    });

    await newLog.save();
    res.status(201).json({ message: "Activity log saved successfully" });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// DELETE all logs
router.delete("/clear", async (req, res) => {
  try {
    await ActivityLog.deleteMany({});
    res.json({ message: "All logs cleared successfully" });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ error: "Failed to clear activity logs" });
  }
});



module.exports = router;

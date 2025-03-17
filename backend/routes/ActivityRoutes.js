// backend/routes/ActivityRoutes.js
const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog"); // adjust path as needed

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

module.exports = router;

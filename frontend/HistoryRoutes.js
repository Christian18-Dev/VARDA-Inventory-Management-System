const express = require("express");
const router = express.Router();
const History = require("../models/History");

// Save inventory history
router.post("/save", async (req, res) => {
  try {
    console.log("Saving history. Request body:", req.body);

    const { branch, products } = req.body;

    if (!branch || !Array.isArray(products)) {
      return res.status(400).json({ message: "Missing branch or products array" });
    }

    const historyEntry = new History({
      branch,
      products,
      // date is auto-set
    });

    await historyEntry.save();
    res.status(201).json({ message: "✅ History saved successfully" });
  } catch (error) {
    console.error("❌ Error saving inventory history:", error);
    res.status(500).json({ message: "Error saving history" });
  }
});

// 🔥 FIXED: Read from shared 'histories' collection
router.get("/:branch", async (req, res) => {
  try {
    const branch = req.params.branch.toUpperCase(); // match saved format
    const history = await History.find({ branch }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

module.exports = router;

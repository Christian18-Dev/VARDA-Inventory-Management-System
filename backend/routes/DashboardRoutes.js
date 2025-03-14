const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const branchCollections = [
  "chknchop_inventory",
  "vardaburger_inventory",
  "thegoodjuice_inventory",
  "thegoodnoodles_inventory",
  "nrbvarda_inventory",
  "pupvarda_inventory",
  "stjudevarda_inventory",
  "intramurosvarda_inventory"
];

router.get("/total-products", async (req, res) => {
  try {
    let totalCount = 0;

    for (const collectionName of branchCollections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const count = await collection.countDocuments();
      totalCount += count;
    }

    res.json({ totalProducts: totalCount });
  } catch (err) {
    console.error("Error fetching total products:", err);
    res.status(500).json({ error: "Failed to fetch total products" });
  }
});

module.exports = router;

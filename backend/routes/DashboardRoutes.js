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

// Fetch top 10 items with highest inventory
router.get("/highest-inventory-items", async (req, res) => {
  try {
    let highestInventoryItems = [];

    for (const collectionName of branchCollections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { projection: { name: 1, current: 1 } }).toArray();

      if (items.length === 0) continue;

      const sortedItems = items
        .filter(item => typeof item.current === "number")
        .sort((a, b) => b.current - a.current)
        .slice(0, 5)
        .map(item => ({
          name: item.name || "Unknown",
          stock: item.current || 0,
          branch: collectionName.replace("_inventory", "")
        }));

      highestInventoryItems.push(...sortedItems);
    }

    res.json(highestInventoryItems.sort((a, b) => b.stock - a.stock).slice(0, 10));
  } catch (err) {
    console.error("Error fetching highest inventory items:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch top 10 items with lowest inventory
router.get("/lowest-inventory-items", async (req, res) => {
  try {
    let lowestInventoryItems = [];

    for (const collectionName of branchCollections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { projection: { name: 1, current: 1 } }).toArray();

      if (items.length === 0) continue;

      const sortedItems = items
        .filter(item => typeof item.current === "number")
        .sort((a, b) => a.current - b.current)
        .slice(0, 5)
        .map(item => ({
          name: item.name || "Unknown",
          stock: item.current || 0,
          branch: collectionName.replace("_inventory", "")
        }));

      lowestInventoryItems.push(...sortedItems);
    }

    res.json(lowestInventoryItems.sort((a, b) => a.stock - b.stock).slice(0, 10));
  } catch (err) {
    console.error("Error fetching lowest inventory items:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch category distribution
router.get("/category-distribution", async (req, res) => {
  try {
    let categoryCounts = {};

    for (const collectionName of branchCollections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const categories = await collection.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]).toArray();

      categories.forEach(cat => {
        categoryCounts[cat._id] = (categoryCounts[cat._id] || 0) + cat.count;
      });
    }

    res.json(Object.keys(categoryCounts).map(category => ({
      name: category,
      count: categoryCounts[category]
    })));
  } catch (err) {
    console.error("Error fetching category distribution:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch inventory data for graph (✅ FIXED: Added `branch` field)
router.get("/inventory-data", async (req, res) => {
  try {
    let inventoryData = [];

    for (const collectionName of branchCollections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { projection: { name: 1, current: 1 } }).toArray();

      if (items.length === 0) continue;

      inventoryData.push(
        ...items
          .filter(item => typeof item.current === "number")
          .map(item => ({
            name: item.name || "Unknown",
            stock: item.current || 0,
            branch: collectionName
              .replace("_inventory", "") // Remove `_inventory`
              .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) // Capitalize first letter of each word
          }))
      );
    }

    res.json(inventoryData.sort((a, b) => b.stock - a.stock).slice(0, 10));
  } catch (err) {
    console.error("Error fetching inventory data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

module.exports = router;

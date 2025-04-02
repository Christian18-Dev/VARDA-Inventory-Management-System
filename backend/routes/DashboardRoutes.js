const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Region and branch structure matching your frontend
const regions = {
  "LAGUNA": ["LAGUNA CHKN CHOP", "LAGUNA VARDA BURGER", "LAGUNA THE GOOD JUICE", "LAGUNA THE GOOD NOODLE BAR"],
  "LIPA BATANGAS": ["LIPA CHKN CHOP", "LIPA VARDA BURGER", "LIPA SILOG", "LIPA NRB"],
};

// Map branch names to collection names
const branchToCollection = {
  "LAGUNA CHKN CHOP": "lagunachknchop_inventory",
  "LAGUNA VARDA BURGER": "lagunavardaburger_inventory",
  "LAGUNA THE GOOD JUICE": "lagunathegoodjuice_inventory",
  "LAGUNA THE GOOD NOODLE BAR": "lagunathegoodnoodlebar_inventory",
  "LIPA CHKN CHOP": "lipachknchop_inventory",
  "LIPA VARDA BURGER": "lipavardaburger_inventory",
  "LIPA SILOG": "lipasilog_inventory",
  "LIPA NRB": "lipanrb_inventory",
};

// Helper function to get collections based on region/branch
const getCollectionsToQuery = (branch, region) => {
  if (branch) {
    // If specific branch is selected
    const collectionName = branchToCollection[branch];
    return collectionName ? [collectionName] : [];
  }
  
  if (region) {
    // If region is selected but no specific branch
    const regionBranches = regions[region] || [];
    return regionBranches.map(b => branchToCollection[b]).filter(Boolean);
  }
  
  // Default: return all collections
  return Object.values(branchToCollection);
};

// Fetch top items with highest inventory
router.get("/highest-inventory-items", async (req, res) => {
  try {
    const { branch, region } = req.query;
    const collectionsToQuery = getCollectionsToQuery(branch, region);
    
    let highestInventoryItems = [];

    for (const collectionName of collectionsToQuery) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { projection: { name: 1, current: 1, category: 1 } }).toArray();

      if (items.length === 0) continue;

      const sortedItems = items
        .filter(item => typeof item.current === "number")
        .sort((a, b) => b.current - a.current)
        .slice(0, branch ? 10 : 5)
        .map(item => ({
          name: item.name || "Unknown",
          stock: item.current || 0,
          category: item.category || "Uncategorized",
          branch: Object.keys(branchToCollection).find(key => branchToCollection[key] === collectionName)
        }));

      highestInventoryItems.push(...sortedItems);
    }

    const result = highestInventoryItems
      .sort((a, b) => b.stock - a.stock)
      .slice(0, branch ? 20 : 10);

    res.json(result);
  } catch (err) {
    console.error("Error fetching highest inventory items:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch top items with lowest inventory
router.get("/lowest-inventory-items", async (req, res) => {
  try {
    const { branch, region } = req.query;
    const collectionsToQuery = getCollectionsToQuery(branch, region);
    
    let lowestInventoryItems = [];

    for (const collectionName of collectionsToQuery) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { projection: { name: 1, current: 1, category: 1 } }).toArray();

      if (items.length === 0) continue;

      const sortedItems = items
        .filter(item => typeof item.current === "number" && item.current > 0)
        .sort((a, b) => a.current - b.current)
        .slice(0, branch ? 10 : 5)
        .map(item => ({
          name: item.name || "Unknown",
          stock: item.current || 0,
          category: item.category || "Uncategorized",
          branch: Object.keys(branchToCollection).find(key => branchToCollection[key] === collectionName)
        }));

      lowestInventoryItems.push(...sortedItems);
    }

    const result = lowestInventoryItems
      .sort((a, b) => a.stock - b.stock)
      .slice(0, branch ? 20 : 10);

    res.json(result);
  } catch (err) {
    console.error("Error fetching lowest inventory items:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch category distribution
router.get("/category-distribution", async (req, res) => {
  try {
    const { branch, region } = req.query;
    const collectionsToQuery = getCollectionsToQuery(branch, region);
    
    let categoryCounts = {};

    for (const collectionName of collectionsToQuery) {
      const collection = mongoose.connection.db.collection(collectionName);
      const categories = await collection.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]).toArray();

      categories.forEach(cat => {
        if (cat._id) {
          categoryCounts[cat._id] = (categoryCounts[cat._id] || 0) + cat.count;
        }
      });
    }

    const result = Object.keys(categoryCounts)
      .map(category => ({
        name: category,
        count: categoryCounts[category]
      }))
      .sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (err) {
    console.error("Error fetching category distribution:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Fetch inventory data for graph
router.get("/inventory-data", async (req, res) => {
  try {
    const { branch, region } = req.query;
    const collectionsToQuery = getCollectionsToQuery(branch, region);
    
    let inventoryData = [];

    for (const collectionName of collectionsToQuery) {
      const collection = mongoose.connection.db.collection(collectionName);
      const items = await collection.find({}, { 
        projection: { 
          name: 1, 
          yesterdayUse: 1,
          use: 1,
          category: 1 
        } 
      }).toArray();

      if (items.length === 0) continue;

      inventoryData.push(
        ...items
          .filter(item => typeof item.yesterdayUse === "number" || typeof item.use === "number")
          .map(item => ({
            name: item.name || "Unknown",
            category: item.category || "Uncategorized",
            stock: item.yesterdayUse ?? item.use ?? 0,
            branch: Object.keys(branchToCollection).find(key => branchToCollection[key] === collectionName)
          }))
      );
    }

    const result = inventoryData
      .sort((a, b) => b.stock - a.stock)
      .slice(0, branch ? 30 : 15);
    res.json(result);
  } catch (err) {
    console.error("Error fetching inventory data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

module.exports = router;
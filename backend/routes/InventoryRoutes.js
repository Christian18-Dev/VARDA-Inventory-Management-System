const express = require("express");
const router = express.Router();
const getInventoryModel = require("../models/BranchInventory");

router.post("/:branch/reset", async (req, res) => {
  try {
    const branch = req.params.branch.toUpperCase();
    const { products } = req.body;

    if (!products) {
      return res.status(400).json({ message: "Products data is required" });
    }

    const Inventory = getInventoryModel(branch);
    
    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            yesterdayUse: product.yesterdayUse,
            todayUse: product.todayUse,
            begInventory: product.begInventory,
            delivered: 0,
            waste: 0,
            withdrawal: 0
          }
        }
      }
    }));

    const result = await Inventory.bulkWrite(bulkOps);

    res.json({
      message: `Inventory reset for ${branch}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ 
      message: "Error resetting inventory",
      error: error.message 
    });
  }
});

// ✅ Get all products for a branch (updated fields)
router.get("/", async (req, res) => {
  try {
    const { branch, page = 1, limit = 15 } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Inventory.find()
      .select("name category price begInventory delivered waste yesterdayUse todayUse withdrawal current")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inventory.countDocuments();

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

// ✅ Add a new product to a branch (updated for new fields)
router.post("/", async (req, res) => {
  try {
    const { branch } = req.query;
    const {
      name,
      category,
      price,
      begInventory,
      delivered,
      waste,
      yesterdayUse,
      todayUse,
      withdrawal,
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });
    if (!name || !category || price === undefined)
      return res.status(400).json({ message: "Name, category, and price are required" });

    const Inventory = getInventoryModel(branch);

    const current =
      (begInventory || 0) + 
      (delivered || 0) - 
      (waste || 0) - 
      (todayUse || 0) - 
      (withdrawal || 0);

    const newProduct = new Inventory({
      name,
      category,
      price: parseFloat(price) || 0,
      begInventory: begInventory || 0,
      delivered: delivered || 0,
      waste: waste || 0,
      yesterdayUse: yesterdayUse || 0,
      todayUse: todayUse || 0,
      withdrawal: withdrawal || 0,
      current,
    });

    const savedProduct = await newProduct.save();

    const responseProduct = await Inventory.findById(savedProduct._id).select("+price");

    res.status(201).json(responseProduct);
  } catch (error) {
    console.error("❌ Error saving product:", error);
    res.status(500).json({ message: "Error saving product", error: error.message });
  }
});

// ✅ Update product in a branch (updated for new fields)
router.put("/:id", async (req, res) => {
  try {
    const { branch } = req.query;
    const {
      name,
      category,
      price,
      begInventory,
      delivered,
      waste,
      yesterdayUse,
      todayUse,
      withdrawal,
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);

    const existingProduct = await Inventory.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate current inventory with new fields
    const current =
      (begInventory || existingProduct.begInventory || 0) +
      (delivered || existingProduct.delivered || 0) -
      (waste || existingProduct.waste || 0) -
      (todayUse || existingProduct.todayUse || 0) -
      (withdrawal || existingProduct.withdrawal || 0);

    const updatedProduct = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: parseFloat(price) || existingProduct.price || 0,
        begInventory: begInventory || existingProduct.begInventory || 0,
        delivered: delivered || existingProduct.delivered || 0,
        waste: waste || existingProduct.waste || 0,
        yesterdayUse: yesterdayUse || existingProduct.yesterdayUse || 0,
        todayUse: todayUse || existingProduct.todayUse || 0,
        withdrawal: withdrawal || existingProduct.withdrawal || 0,
        current,
      },
      { new: true }
    ).select("+price");

    res.json(updatedProduct);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
});

// ✅ Delete a product from a branch (unchanged)
router.delete("/:id", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    await Inventory.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Check DB connection (unchanged)
router.get("/check-db", (req, res) => {
  if (!req.app.locals.db) {
    return res.status(500).json({ message: "Native DB not initialized" });
  }
  res.json({ message: "Native DB is ready!" });
});

module.exports = router;
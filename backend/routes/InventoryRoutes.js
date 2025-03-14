const express = require("express");
const router = express.Router();
const getInventoryModel = require("../models/BranchInventory");
const inventoryController = require("../models/InventoryController");

router.post("/:branch/reset", inventoryController.resetInventory);

// Get all products for a branch (with pagination)
router.get("/", async (req, res) => {
  try {
    const { branch, page = 1, limit = 15 } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Inventory.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inventory.countDocuments();
    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

router.get("/check-db", (req, res) => {
  if (!req.app.locals.db) {
    return res.status(500).json({ message: "Native DB not initialized" });
  }
  res.json({ message: "Native DB is ready!" });
});

// Add a new product to a branch
router.post("/", async (req, res) => {
  try {
    const { branch } = req.query;
    const {
      name,
      category,
      begInventory,
      delivered,
      waste,
      use,
      withdrawal
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });
    if (!name || !category) return res.status(400).json({ message: "Name and category are required" });

    const Inventory = getInventoryModel(branch);

    const current = (begInventory || 0) + (delivered || 0) - (waste || 0) - (use || 0) - (withdrawal || 0);

    const newProduct = new Inventory({
      name,
      category,
      begInventory: begInventory || 0,
      delivered: delivered || 0,
      waste: waste || 0,
      use: use || 0,
      withdrawal: withdrawal || 0,
      current
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error saving product", error });
  }
});

// Update a product in a branch
router.put("/:id", async (req, res) => {
  try {
    const { branch } = req.query;
    const {
      name,
      category,
      begInventory,
      delivered,
      waste,
      use,
      withdrawal
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);

    const current = (begInventory || 0) + (delivered || 0) - (waste || 0) - (use || 0) - (withdrawal || 0);

    const updatedProduct = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        begInventory: begInventory || 0,
        delivered: delivered || 0,
        waste: waste || 0,
        use: use || 0,
        withdrawal: withdrawal || 0,
        current
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
});

// Delete a product from a branch
router.delete("/:id", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

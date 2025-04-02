const express = require("express");
const router = express.Router();
const getInventoryModel = require("../models/BranchInventory");

// ✅ Route to reset inventory for a branch
router.post("/:branch/reset", async (req, res) => {
  try {
    const branch = req.params.branch.toUpperCase();
    console.log(`🔄 Resetting inventory for branch: ${branch}`);

    const Inventory = getInventoryModel(branch);

    // ✅ Reset relevant fields and set `current` equal to `begInventory`
    const result = await Inventory.updateMany(
      {},
      [
        {
          $set: {
            delivered: 0,
            waste: 0,
            use: 0,
            withdrawal: 0,
            begInventory: "$current", // Set current as new begInventory
          },
        },
      ]
    );

    res.json({
      message: `✅ Inventory reset for branch: ${branch}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error resetting inventory:", error);
    res.status(500).json({ message: "Error resetting inventory" });
  }
});

// ✅ Get all products for a branch (with pagination)
router.get("/", async (req, res) => {
  try {
    const { branch, page = 1, limit = 15 } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Inventory.find()
      .select("name category price begInventory delivered waste use withdrawal current")
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

// ✅ Add a new product to a branch
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
      use,
      withdrawal,
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });
    if (!name || !category || price === undefined)
      return res.status(400).json({ message: "Name, category, and price are required" });

    const Inventory = getInventoryModel(branch);

    const current =
      (begInventory || 0) + (delivered || 0) - (waste || 0) - (use || 0) - (withdrawal || 0);

    const newProduct = new Inventory({
      name,
      category,
      price: parseFloat(price) || 0,
      begInventory: begInventory || 0,
      delivered: delivered || 0,
      waste: waste || 0,
      use: use || 0,
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

// ✅ Update product in a branch (without automatic use adjustment)
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
      use,
      withdrawal,
    } = req.body;

    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);

    const existingProduct = await Inventory.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate current inventory without adjusting use automatically
    const current =
      (begInventory !== undefined ? begInventory : existingProduct.begInventory || 0) +
      (delivered !== undefined ? delivered : existingProduct.delivered || 0) -
      (waste !== undefined ? waste : existingProduct.waste || 0) -
      (use !== undefined ? use : existingProduct.use || 0) -
      (withdrawal !== undefined ? withdrawal : existingProduct.withdrawal || 0);

    const updatedProduct = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        name: name !== undefined ? name : existingProduct.name,
        category: category !== undefined ? category : existingProduct.category,
        price: price !== undefined ? parseFloat(price) || 0 : existingProduct.price,
        begInventory: begInventory !== undefined ? begInventory : existingProduct.begInventory,
        delivered: delivered !== undefined ? delivered : existingProduct.delivered,
        waste: waste !== undefined ? waste : existingProduct.waste,
        use: use !== undefined ? use : existingProduct.use, // Only update if explicitly provided
        withdrawal: withdrawal !== undefined ? withdrawal : existingProduct.withdrawal,
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

// ✅ Delete a product from a branch
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

// ✅ Check DB connection
router.get("/check-db", (req, res) => {
  if (!req.app.locals.db) {
    return res.status(500).json({ message: "Native DB not initialized" });
  }
  res.json({ message: "Native DB is ready!" });
});

module.exports = router;
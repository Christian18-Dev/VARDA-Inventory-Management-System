const express = require("express");
const router = express.Router();
const getInventoryModel = require("../models/BranchInventory");

// ✅ Get all products for a branch (with pagination)
router.get("/", async (req, res) => {
  try {
    const { branch, page = 1, limit = 15 } = req.query;
    if (!branch) return res.status(400).json({ message: "Branch is required" });

    const Inventory = getInventoryModel(branch);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Explicitly select `price` field
    const products = await Inventory.find()
      .select("name category price begInventory delivered waste use withdrawal current")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inventory.countDocuments();

    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
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

    // ✅ Calculate current inventory
    const current =
      (begInventory || 0) + (delivered || 0) - (waste || 0) - (use || 0) - (withdrawal || 0);

    // ✅ Create new product
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

    // ✅ Save the product
    const savedProduct = await newProduct.save();

    // ✅ Ensure price is included in the response
    const responseProduct = await Inventory.findById(savedProduct._id).select("+price");

    res.status(201).json(responseProduct);
  } catch (error) {
    console.error("❌ Error saving product:", error);
    res.status(500).json({ message: "Error saving product", error: error.message });
  }
});

// ✅ Update product in a branch
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

    // ✅ Calculate current inventory
    const current =
      (begInventory || 0) + (delivered || 0) - (waste || 0) - (use || 0) - (withdrawal || 0);

    // ✅ Update product
    const updatedProduct = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: parseFloat(price) || 0,
        begInventory: begInventory || 0,
        delivered: delivered || 0,
        waste: waste || 0,
        use: use || 0,
        withdrawal: withdrawal || 0,
        current,
      },
      { new: true }
    ).select("+price");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

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

// ✅ Check if the database is connected
router.get("/check-db", (req, res) => {
  if (!req.app.locals.db) {
    return res.status(500).json({ message: "Native DB not initialized" });
  }
  res.json({ message: "Native DB is ready!" });
});

module.exports = router;

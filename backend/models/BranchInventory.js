const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    begInventory: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    waste: { type: Number, default: 0 },
    use: { type: Number, default: 0 },
    withdrawal: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Cache for models per branch to avoid model overwrite errors
const inventoryModels = {};

const getInventoryModel = (branch) => {
  const collectionName = `${branch.toLowerCase().replace(/\s+/g, "")}_inventory`;

  if (!inventoryModels[collectionName]) {
    inventoryModels[collectionName] = mongoose.model(collectionName, inventorySchema, collectionName);
  }

  return inventoryModels[collectionName];
};

module.exports = getInventoryModel;

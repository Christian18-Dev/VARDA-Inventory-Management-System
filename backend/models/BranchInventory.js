const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0, select: true }, // ✅ Add select: true
    begInventory: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    waste: { type: Number, default: 0 },
    use: { type: Number, default: 0 },
    withdrawal: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventorySchema.set('toJSON', { virtuals: true, versionKey: false }); 

const inventoryModels = {};
const getInventoryModel = (branch) => {
  const collectionName = `${branch.toLowerCase().replace(/\s+/g, "")}_inventory`;

  if (mongoose.connection.models[collectionName]) {
    delete mongoose.connection.models[collectionName];
  }

  if (!inventoryModels[collectionName]) {
    inventoryModels[collectionName] = mongoose.model(collectionName, inventorySchema, collectionName);
  }

  return inventoryModels[collectionName];
};

module.exports = getInventoryModel;
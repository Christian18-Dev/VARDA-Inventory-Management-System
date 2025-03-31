const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0, select: true },
    begInventory: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    waste: { type: Number, default: 0 },
    yesterdayUse: { type: Number, default: 0 },  // New field
    todayUse: { type: Number, default: 0 },     // New field
    withdrawal: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual for backward compatibility with old 'use' field
inventorySchema.virtual('use').get(function() {
  return this.todayUse; // Default to todayUse for backward compatibility
});

// Ensure price is always included in the response
inventorySchema.set('toJSON', { 
  virtuals: true, 
  versionKey: false,
  transform: function(doc, ret) {
    // Include virtual fields in output
    ret.use = doc.todayUse; // Map to todayUse for backward compatibility
    return ret;
  }
}); 

// Pre-save hook to calculate current inventory
inventorySchema.pre('save', function(next) {
  this.current = Math.max(
    (this.begInventory || 0) + 
    (this.delivered || 0) - 
    (this.waste || 0) - 
    (this.todayUse || 0) - 
    (this.withdrawal || 0),
    0
  );
  next();
});

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
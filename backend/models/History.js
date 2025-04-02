const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  branch: { type: String, required: true },
  date: { type: Date, default: Date.now }, // ✅ Auto adds timestamp
  products: [
    {
      name: String,
      category: String,
      price: Number, 
      begInventory: Number,
      delivered: Number,
      waste: Number,
      use: Number,
      withdrawal: Number,
      current: Number,
    },
  ],
});

module.exports = mongoose.model("History", HistorySchema);
const mongoose = require('mongoose');

const dtrSchema = new mongoose.Schema({
  username: { type: String, required: true },
  role: { type: String, required: true },
  date: { type: String, required: true },
  timeIn: { type: String },
  timeOut: { type: String },
  selfieIn: { type: String },   // base64 or image URL
  selfieOut: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DTR', dtrSchema);

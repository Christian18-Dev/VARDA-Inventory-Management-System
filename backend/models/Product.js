import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  branch: { type: String, required: true },
  // Add other fields like category, price, etc., if needed
});

const Product = mongoose.model("Product", productSchema);

export default Product;
    
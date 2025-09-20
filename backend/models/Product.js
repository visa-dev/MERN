const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, text: true },
  description: String,
  price: { type: Number, required: true },
  imageUrl: String,
  category: { type: String, enum: ["Men", "Women", "Kids"], required: true },
  sizes: [String],
}, { timestamps: true });

productSchema.index({ name: "text", description: "text" });
module.exports = mongoose.model("Product", productSchema);

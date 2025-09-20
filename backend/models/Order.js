const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{
    name: String,
    size: String,
    quantity: Number,
    price: Number,
  }],
  total: Number,
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);

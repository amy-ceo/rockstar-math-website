const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["CREATED", "COMPLETED", "FAILED"], default: "CREATED" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);

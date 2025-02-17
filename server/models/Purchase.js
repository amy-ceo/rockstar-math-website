const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stripeProductId: { type: String, required: true }, // ✅ Store Stripe Product ID instead of local Product
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  purchaseDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "cancelled"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Purchase", PurchaseSchema);

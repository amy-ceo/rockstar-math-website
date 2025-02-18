const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, default: "Pending" }, // ✅ Payment Status
    paymentMethod: { type: String, default: "PayPal" },
    cartItems: { type: Array, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);

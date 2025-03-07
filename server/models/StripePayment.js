const mongoose = require('mongoose');

const StripePaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentIntentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billingEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: 'Stripe' },
  cartItems: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StripePayment', StripePaymentSchema);

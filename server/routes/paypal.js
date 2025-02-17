const express = require("express");
const router = express.Router();
const paypal = require("@paypal/checkout-server-sdk");
const client = require("../config/paymentConfig");
const Order = require("../models/OrderModel"); // ✅ Import Order Model
const sendEmail = require("../utils/emailSender"); // ✅ Import Your Nodemailer Function
const Register = require("../models/registerModel"); // ✅ Import User Model

// ✅ Create PayPal Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "USD" } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: currency, value: amount } }],
    });

    const order = await client.execute(request);
    
    // ✅ Ensure Order ID Exists
    if (!order.result || !order.result.id) {
      console.error("❌ PayPal Order Error: Missing Order ID from PayPal");
      return res.status(500).json({ error: "PayPal order creation failed. No orderId returned." });
    }

    console.log(`✅ PayPal Order Created: ${order.result.id}`);
    res.status(200).json({ orderId: order.result.id });

  } catch (error) {
    console.error("❌ PayPal Order Error:", error.message);
    res.status(500).json({ error: "PayPal order creation failed" });
  }
});


// ✅ Capture PayPal Payment & Save to Database
router.post("/capture-order", async (req, res) => {
  try {
    const { orderId, userId, cartItems, userEmail } = req.body;
    if (!orderId) return res.status(400).json({ error: "Order ID is required" });
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await client.execute(request);
    const captureData = capture.result;

    console.log(`✅ PayPal Payment Captured: ${captureData.id}`);

    // ✅ Get Payment Source (Debit, Credit, PayPal)
    const paymentSource = captureData.payment_source?.card ? "Debit/Credit Card" : "PayPal";

    // ✅ Format Purchased Classes According to Schema
    const purchasedClasses = cartItems.map(item => ({
        title: item.name || "Unknown Class", // ✅ Ensure title exists
        teacher: item.teacher || "Unknown Teacher",
        date: new Date().toISOString(), // ✅ Use current date if no date provided
        image: item.image || "",
        description: item.description || "",
    }));

    // ✅ Store Paid Items in Order Collection
    const newOrder = await Order.create({
        userId,
        orderId: captureData.id,
        status: "Paid",
        amount: captureData.purchase_units[0].amount.value,
        currency: captureData.purchase_units[0].amount.currency_code,
        items: purchasedClasses, // ✅ Save Purchased Items Correctly
        paymentMethod: paymentSource,
        createdAt: new Date(),
    });

    console.log("✅ Order saved:", newOrder);

    // ✅ Update User's Purchased Classes in Database
    const user = await Register.findById(userId);
    if (user) {
        user.purchasedClasses = [...user.purchasedClasses, ...purchasedClasses]; // ✅ Append Purchased Classes
        await user.save();
    }

    // ✅ Send Email to User
    const userEmailContent = `
        <h2>Payment Successful</h2>
        <p>Thank you for your payment of <strong>$${newOrder.amount} USD</strong>.</p>
        <p>Your Order ID: <strong>${newOrder.orderId}</strong></p>
        <p>Payment Method: <strong>${paymentSource}</strong></p>
        <p><strong>Purchased Classes:</strong></p>
        <ul>
            ${purchasedClasses.map(classItem => `<li>${classItem.title} by ${classItem.teacher}</li>`).join("")}
        </ul>
        <p>You will receive further details soon.</p>
    `;
    await sendEmail(userEmail, "Payment Successful - Your Purchased Classes", "", userEmailContent);

      // ✅ Send Email to Admin
      const adminEmail = "bhussnain966@gmail.com";
      const adminEmailContent = `
          <h2>New Order Received</h2>
          <p>A new payment has been received from ${userEmail}.</p>
          <p>Amount: <strong>$${newOrder.amount} USD</strong></p>
          <p>Order ID: <strong>${newOrder.orderId}</strong></p>
          <p>Payment Method: <strong>${paymentSource}</strong></p>
      `;
      await sendEmail(adminEmail, "New Order Received", "", adminEmailContent);

      res.status(200).json({ message: "PayPal Payment Captured & Emails Sent Successfully", orderId: captureData.id });
  } catch (error) {
      console.error("❌ PayPal Capture Error:", error.message);
      res.status(500).json({ error: "Failed to capture PayPal payment and send email" });
  }
});


module.exports = router;

const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");

// ✅ Use `bodyParser.raw()` to avoid parsing errors
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }), // ✅ Ensure Raw Body
  async (req, res) => {
    let event;
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook Signature Verification Failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔔 Received Stripe Webhook Event:", event.type);

    if (event.type === "payment_intent.succeeded") {
      console.log("✅ Payment Intent Succeeded Event Triggered");
      const paymentIntent = event.data.object;

      console.log("🔹 Payment Intent ID:", paymentIntent.id);
      console.log("🔹 Metadata:", paymentIntent.metadata);

      if (!paymentIntent.metadata || !paymentIntent.metadata.userId) {
        console.error("❌ Missing metadata in payment intent!");
        return res.status(400).json({ error: "Missing metadata in payment intent" });
      }

      const userId = paymentIntent.metadata.userId;
      const cartItems = JSON.parse(paymentIntent.metadata.cartItems || "[]");

      console.log("🔹 User ID:", userId);
      console.log("🔹 Cart Items:", cartItems);

      try {
        console.log("📡 Calling addPurchasedClass API...");
        const purchaseResponse = await fetch(
          "https://backend-production-cbe2.up.railway.app/api/add-purchased-class",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              purchasedItems: cartItems.map((item) => ({
                name: item.name,
                description: item.description || "No description available",
              })),
              userEmail: "No email provided",
            }),
          }
        );

        const purchaseResult = await purchaseResponse.json();
        console.log("✅ Purchased Classes API Response:", purchaseResult);

        if (!purchaseResponse.ok) {
          console.warn("⚠️ Issue updating purchased classes:", purchaseResult.message);
        }
      } catch (error) {
        console.error("❌ Error calling addPurchasedClass API:", error);
      }
    } else {
      console.log("⚠️ Webhook received but not a payment event:", event.type);
    }

    res.sendStatus(200);
  }
);

module.exports = router;

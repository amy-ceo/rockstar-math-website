const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const Register = require("../models/registerModel"); // Ensure Register Model is imported
const sendEmail = require("../utils/emailSender");
const paypalClient = require("../config/paypal");

// 🎯 Create PayPal Order
exports.createOrder = async (req, res) => {
  try {
    let { userId, amount, cartItems } = req.body;

    amount = parseFloat(amount);
    if (!userId || isNaN(amount) || !cartItems || cartItems.length === 0 || amount <= 0) {
      console.error("❌ Invalid Request Data:", { userId, amount, cartItems });
      return res.status(400).json({ error: "Invalid request data" });
    }

    console.log("🛒 Creating PayPal Order:", { userId, amount, cartItems });

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: amount.toFixed(2) },
            },
          },
          description: "E-commerce Payment",
          items: cartItems.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: "USD",
              value: parseFloat(item.price).toFixed(2),
            },
            quantity: item.quantity ? Number(item.quantity).toString() : "1",
            category: "DIGITAL_GOODS",
          })),
        },
      ],
    });

    const order = await paypalClient.execute(request);
    if (!order.result || !order.result.id) {
      console.error("❌ PayPal Order Creation Failed - No ID Returned");
      return res.status(500).json({ error: "PayPal order creation failed" });
    }

    res.json({ orderId: order.result.id });
  } catch (error) {
    console.error("❌ PayPal Order Error:", error.message || error);
    res.status(500).json({ error: "Internal Server Error", details: error.message || error });
  }
};

// 🎯 Capture PayPal Order & Update Purchased Classes
exports.captureOrder = async (req, res) => {
    try {
      const { orderId, user } = req.body;
  
      if (!orderId || !user || !user._id || !user.billingEmail || !Array.isArray(user.cartItems) || user.cartItems.length === 0) {
        console.error("❌ Missing required fields:", { orderId, user });
        return res.status(400).json({ error: "Missing required fields or empty cart items" });
      }
  
      console.log("🛒 Capturing PayPal Order:", orderId);
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
      captureRequest.requestBody({});
      
      let captureResponse;
      try {
        captureResponse = await paypalClient.execute(captureRequest);
        console.log("✅ Capture Response:", captureResponse.result);
      } catch (captureError) {
        console.error("❌ PayPal Capture Error:", captureError);
        return res.status(400).json({ error: "PayPal capture failed", details: captureError.message });
      }
  
      if (!captureResponse.result || captureResponse.result.status !== "COMPLETED") {
        console.error("❌ PayPal Capture Failed - Status:", captureResponse.result.status);
        return res.status(400).json({ error: "Payment capture failed", details: captureResponse.result });
      }
  
      const captureDetails = captureResponse.result.purchase_units[0].payments?.captures?.[0];
  
      if (!captureDetails) {
        console.error("❌ Capture Details Missing:", captureResponse.result);
        return res.status(400).json({ error: "Capture details missing from PayPal response" });
      }
  
      const amount = captureDetails.amount.value;
      const currency = captureDetails.amount.currency_code;
      const paymentIntentId = captureDetails.id; // ✅ Use PayPal capture ID as `paymentIntentId`
  
      // ✅ Ensure `paymentIntentId` is unique before saving
      const existingPayment = await Payment.findOne({ paymentIntentId });
      if (existingPayment) {
        console.warn("⚠️ Duplicate Payment Detected, Skipping Save:", paymentIntentId);
        return res.json({ message: "Payment already recorded.", payment: captureResponse.result });
      }
  
      // ✅ Save Payment Record
      try {
        console.log("🔹 Saving Payment Details...");
        const newPayment = new Payment({
          orderId,
          paymentIntentId, // ✅ Save unique payment ID
          userId: user._id,
          billingEmail: user.billingEmail,
          amount,
          currency,
          status: "Completed",
          paymentMethod: "PayPal",
          cartItems: user.cartItems || [],
        });
  
        await newPayment.save();
        console.log("✅ Payment Record Saved!");
      } catch (saveError) {
        console.error("❌ Error Saving Payment:", saveError);
        return res.status(500).json({ error: "Database error while saving payment.", details: saveError.message });
      }
  
      // ✅ Call `addPurchasedClass` API to add purchased items
      try {
        console.log("📡 Calling addPurchasedClass API...");
        const purchaseResponse = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/add-purchased-class`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              purchasedItems: user.cartItems.map(item => ({
                name: item.name,
                description: item.description || "No description available",
              })),
              userEmail: user.billingEmail,
            }),
          }
        );
  
        const purchaseResult = await purchaseResponse.json();
        console.log("✅ Purchased Classes API Response:", purchaseResult);
  
        if (!purchaseResponse.ok) {
          console.warn("⚠️ Issue updating purchased classes:", purchaseResult.message);
        }
      } catch (purchaseError) {
        console.error("❌ Error calling addPurchasedClass API:", purchaseError);
      }
  
      // ✅ Send Confirmation Email
      try {
        await sendEmail(
          user.billingEmail,
          `Order Confirmation - Your Purchase is Successful!`,
          `Your order ${orderId} was successful.`,
          "<h3>Thank you!</h3>"
        );
        console.log("✅ Confirmation Email Sent");
      } catch (emailError) {
        console.error("❌ Email Sending Failed:", emailError);
      }
  
      res.json({ message: "Payment captured & records updated successfully.", payment: captureResponse.result });
  
    } catch (error) {
      console.error("❌ Error Capturing PayPal Payment:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message || error });
    }
  };
  

// 🎯 PayPal Webhook for Order Capture
exports.paypalWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("🔔 Received PayPal Webhook Event:", JSON.stringify(event, null, 2));

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource.id;
      console.log("✅ Payment Captured via Webhook:", orderId);

      await Payment.updateOne({ orderId }, { status: "Completed" });
    } else {
      console.warn("⚠️ Webhook received but not a capture event:", event.event_type);
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    res.status(500).json({ error: "Webhook processing failed", details: error.message });
  }
};

const paypal = require('@paypal/checkout-server-sdk')
const Payment = require('../models/Payment')
const sendEmail = require('../utils/emailSender')

// PayPal Client Setup
const paypalClient = require('../config/paypal')

// 🎯 Create PayPal Order
exports.createOrder = async (req, res) => {
  try {
    let { userId, amount, cartItems } = req.body

    // ✅ Ensure amount is a valid number
    amount = parseFloat(amount)
    if (!userId || isNaN(amount) || !cartItems || cartItems.length === 0 || amount <= 0) {
      console.error('❌ Invalid Request Data:', { userId, amount, cartItems })
      return res.status(400).json({ error: 'Invalid request data' })
    }

    console.log('🛒 Received Order Request:', { userId, amount, cartItems })

    // ✅ Prepare PayPal Order Request
    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2), // ✅ Ensure it is a string
            breakdown: {
              item_total: { currency_code: 'USD', value: amount.toFixed(2) }, // ✅ Fix required
            },
          },
          description: 'E-commerce Payment',
          items: cartItems.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: parseFloat(item.price).toFixed(2), // ✅ Convert price properly
            },
            quantity: item.quantity ? Number(item.quantity).toString() : '1', // ✅ Ensure quantity is string
            category: 'DIGITAL_GOODS',
          })),
        },
      ],
      application_context: {
        brand_name: 'Rockstar Math',
        locale: 'en-US',
        user_action: 'PAY_NOW',
        return_url: 'https://your-frontend.com/success',
        cancel_url: 'https://your-frontend.com/cancel',
      },
    })

    // ✅ Execute PayPal Order
    const order = await paypalClient.execute(request)
    console.log('✅ PayPal Order Response:', order.result)

    if (!order.result || !order.result.id) {
      console.error('❌ PayPal Order Creation Failed - No ID Returned')
      return res.status(500).json({ error: 'PayPal order creation failed' })
    }

    res.json({ orderId: order.result.id })
  } catch (error) {
    console.error('❌ PayPal Order Error:', error.message || error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error })
  }
}

// 🎯 Capture PayPal Order & Send Email
// 🎯 Capture PayPal Order & Update Purchase
exports.captureOrder = async (req, res) => {
    try {
      const { orderId, user } = req.body;
  
      if (!orderId || !user || !user._id || !user.billingEmail) {
        console.error("❌ Missing required fields:", { orderId, user });
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      console.log("🛒 Capturing PayPal Order:", orderId);
  
      // ✅ Capture PayPal Payment
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
      captureRequest.requestBody({});
      const captureResponse = await paypalClient.execute(captureRequest);
  
      console.log("✅ Capture Response:", captureResponse.result);
  
      if (!captureResponse.result || captureResponse.result.status !== "COMPLETED") {
        console.error("❌ PayPal Capture Failed:", captureResponse.result);
        return res.status(400).json({ error: "Payment capture failed" });
      }
  
      const purchaseUnit = captureResponse.result.purchase_units[0];
      const captureDetails = purchaseUnit.payments?.captures?.[0];
  
      if (!captureDetails) {
        console.error("❌ Capture Details Missing:", captureResponse.result);
        return res.status(400).json({ error: "Capture details missing from PayPal response" });
      }
  
      const amount = captureDetails.amount.value;
      const currency = captureDetails.amount.currency_code;
  
      // ✅ Fix: Ensure userEmail is included
      const userEmail = user.email || user.billingEmail || "no-email@unknown.com";
  
      // ✅ Save Payment Details First
      try {
        const newPayment = new Payment({
          orderId,
          userId: user._id,
          userEmail, // ✅ Ensure userEmail is provided
          amount,
          currency,
          status: "Completed",
          paymentMethod: "PayPal",
          cartItems: user.cartItems || [],
        });
  
        await newPayment.save();
        console.log("✅ Payment Record Saved");
      } catch (err) {
        console.error("❌ Failed to Save Payment Record:", err);
        return res.status(500).json({ error: "Failed to save payment, but PayPal capture was successful." });
      }
  
      res.json({ message: "Payment captured successfully", payment: captureResponse.result });
  
    } catch (error) {
      console.error("❌ Error Capturing PayPal Payment:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message || error });
    }
  };
  

exports.paypalWebhook = async (req, res) => {
    try {
      const event = req.body;
  
      console.log("🔔 Received PayPal Webhook Event:", JSON.stringify(event, null, 2));
  
      if (!event || !event.event_type) {
        console.warn("⚠️ Webhook received but missing event_type:", event);
        return res.status(400).json({ error: "Invalid webhook payload" });
      }
  
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const orderId = event.resource.id;
  
        console.log("✅ Payment Captured via Webhook:", orderId);
  
        // Update order status in database
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
  
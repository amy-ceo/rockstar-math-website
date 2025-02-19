require("dotenv").config();
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded ✅" : "Not Loaded ❌");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require("./routes/registerRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const contactRoutes = require('./routes/contactRoutes');
const stripeRoutes = require("./routes/stripe");
const twilio = require("twilio");
const consultationRoutes = require("./routes/consultationRoutes");
const waitlist = require("./routes/waitlist");
const zoomRoutes = require("./routes/zoomRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const ordersRoute = require("./routes/order.js");
const paypalRoutes = require("./routes/paypal.js");
connectDB();

const app = express();
const endpointSecret = "whsec_0WfKaaK99FaR33MCNxNZiVlAP9tt5ue7";
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5000'
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ Parse JSON for all other routes
app.use(express.json());

// Webhook route (must come before other routes to avoid JSON parsing)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }), // Use raw body for webhook
  (req, res) => {
    console.log("🔍 RAW BODY:", req.body.toString()); // Debug request body

    let event = req.body;

    if (endpointSecret) {
      const signature = req.headers["stripe-signature"];
      try {
        // Construct event using raw body & signature
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.sendStatus(400);
      }
    }

    console.log("✅ Webhook verified:", event.type);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log(`💰 Payment Successful: ${session.id}`);
        // You can now fulfill the order or update the database
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(`✅ PaymentIntent for ${paymentIntent.amount} was successful!`);
        break;

      case "payment_method.attached":
        const paymentMethod = event.data.object;
        console.log("💳 Payment method attached:", paymentMethod.id);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200); // Acknowledge receipt of the event
  }
);

// Routes
app.use('/api/auth', authRoutes);
app.use("/api", subscribeRoute);
app.use('/api/contact', contactRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api", registerRoutes);
app.use("/api/consultation", consultationRoutes);
app.use("/api", waitlist);
app.use("/api/paypal", require("./routes/paypal"));
app.use("/api", zoomRoutes);
app.use('/api/users', userRoutes);
app.use("/api/orders", ordersRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

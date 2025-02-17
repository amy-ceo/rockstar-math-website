require("dotenv").config();
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded ✅" : "Not Loaded ❌");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require("./routes/registerRoutes");
// const otpRoutes = require("./routes/otpRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const contactRoutes = require('./routes/contactRoutes');
const stripeRoutes = require("./routes/stripe"); // Import the Stripe route
const twilio = require("twilio");
const consultationRoutes = require("./routes/consultationRoutes");
const waitlist = require("./routes/waitlist");
const zoomRoutes = require("./routes/zoomRoutes");
const userRoutes = require("./routes/userRoutes")
const paymentRoutes = require("./routes/paymentRoutes"); // ✅ Import Payment Routes
const ordersRoute = require("./routes/order.js"); // ✅ Import Orders Route
const paypalRoutes = require("./routes/paypal.js")
connectDB();

const app = express();
// ✅ Allow raw body for Stripe webhook ONLY
const endpointSecret = "whsec_0WfKaaK99FaR33MCNxNZiVlAP9tt5ue7"
const allowedOrigins = [
  'http://localhost:8080', // Local Development URL
  'https://frontend-production-90a4.up.railway.app' // Production URL
];

// ✅ CORS Middleware
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
// ⚡ Apply JSON parser only for other routes

let otpStore = {}; // Temporary OTP storage (use Redis for production)

// ✅ Send OTP API
app.post("/api/send-otp", async (req, res) => {
    const { phone } = req.body;
  
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required!" });
    }
  
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  
    try {
      const message = await client.messages.create({
        body: `Your OTP code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
  
      console.log("OTP Sent:", message.sid);
      
      otpStore[phone] = otp; // ✅ Store OTP (Use Redis for production!)
  
      res.json({ success: true, otp }); // ⚠️ Remove `otp` from response in production
    } catch (error) {
      console.error("Twilio Error:", error);
      res.status(500).json({ error: "Failed to send OTP. Please check Twilio settings!" });
    }
  });

// ✅ Verify OTP API
app.post("/api/verify-otp", (req, res) => {
    const { phone, otp } = req.body;
  
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required!" });
    }
  
    if (otpStore[phone] && otpStore[phone] == otp) {
      delete otpStore[phone]; // ✅ Remove OTP after successful verification
      return res.json({ success: true, message: "OTP Verified Successfully" });
    } else {
      return res.status(400).json({ error: "Invalid OTP or OTP expired." });
    }
  });

app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }), 
    (req, res) => {
        console.log("🔍 RAW BODY:", req.body.toString()); // ✅ Debug request body

        let event = req.body;

        if (endpointSecret) {
            const signature = req.headers["stripe-signature"];
            try {
                // ✅ Construct event using raw body & signature
                event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
            } catch (err) {
                console.error("❌ Webhook signature verification failed:", err.message);
                return res.sendStatus(400);
            }
        }

        console.log("✅ Webhook verified:", event.type);

        // ✅ Handle different event types
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

        res.sendStatus(200); // ✅ Acknowledge receipt of the event
    }
);

// ✅ JSON parser for other API routes
app.use(express.json());


  
// Routes
app.use('/api/auth', authRoutes);
app.use("/api", subscribeRoute);
app.use('/api/contact', contactRoutes);
app.use("/api/stripe", stripeRoutes); // Set up route
app.use("/api", registerRoutes);
// app.use("/api/otp", otpRoutes);
app.use("/api/consultation", consultationRoutes);
app.use("/api", waitlist);
app.use("/api/paypal", require("./routes/paypal")); // PayPal API
app.use("/api", zoomRoutes);
app.use('/api/users', userRoutes); // ✅ Now users API will work properly
app.use("/api/orders", ordersRoute); // ✅ Set orders route
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

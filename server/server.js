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
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
console.log(endpointSecret)
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

app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    let event = request.body;

    // ✅ Only verify the event if you have a webhook secret
    if (endpointSecret) {
        const signature = request.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
        } catch (err) {
            console.log(`⚠️ Webhook signature verification failed: ${err.message}`);
            return response.sendStatus(400);
        }
    }

    // ✅ Handle `checkout.session.completed` event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log(`💰 Checkout Successful!`);
        console.log(`✅ Payment Intent ID: ${session.payment_intent}`);
        console.log(`🛒 Payment Status: ${session.payment_status}`);
        console.log(`💳 Payment Method Types: ${session.payment_method_types.join(", ")}`);
        console.log(`🔗 Success URL: ${session.success_url}`);

        // TODO: Save order details in the database (Example)
        /*
        saveOrderToDB({
            paymentIntentId: session.payment_intent,
            paymentStatus: session.payment_status,
            paymentMethods: session.payment_method_types,
            successURL: session.success_url,
            totalAmount: session.amount_total,
        });
        */
    } else {
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // ✅ Return a 200 response to acknowledge receipt of the event
    response.sendStatus(200);
});

// ✅ JSON parser for other routes
app.use(express.json());

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

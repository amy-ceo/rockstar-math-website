require("dotenv").config();
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded ✅" : "Not Loaded ❌");
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require("./routes/registerRoutes");
// const otpRoutes = require("./routes/otpRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const contactRoutes = require('./routes/contactRoutes');
const stripeRoutes = require("./routes/stripe"); // Import the Stripe route
const twilio = require("twilio");
const zoomRoutes = require('./routes/zoomRoutes.js');
const consultationRoutes = require("./routes/consultationRoutes");
const waitlist = require("./routes/waitlist");
const userRoutes = require("./routes/userRoutes")
const paymentRoutes = require("./routes/paymentRoutes"); // ✅ Import Payment Routes
const ordersRoute = require("./routes/order.js"); // ✅ Import Orders Route
const paypalRoutes = require("./routes/paypalRoutes.js")
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require('./routes/blogRoutes');
const bcrypt = require("bcryptjs");
const proxyRoutes = require('./routes/proxyRoutes'); // ✅ Import Proxy Routes
const webhookHandler = require("./routes/webhookHandlerRoute.js");
// ✅ Set Fallback for Missing Crypto Module
if (!global.crypto) {
  global.crypto = require("crypto");
}
bcrypt.setRandomFallback((len) => global.crypto.randomBytes(len)); // ✅ Fixes Error

connectDB();
const app = express();

// ✅ Middleware Order Fixes
// ======================== Stripe Webhook Middleware ========================
app.use(
  "/api/stripe/webhook", 
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log('🔔 Stripe Webhook Received');
    next();
  }
);


// app.use((req, res, next) => {
//   const allowedOrigin = ["https://zoom.us", undefined]; // ✅ Zoom Webhooks can have undefined origin
//   if (allowedOrigin.includes(req.headers.origin)) {
//       res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
//       res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//       res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//       res.setHeader("Access-Control-Allow-Credentials", "true");
//   }
//   next();
// });

// ========================= General Middleware ==============================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, }));

// ✅ CORS Configuration

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://www.rockstarmath.com",
    "https://rockstarmath.com",
    "https://calendly.com",
    "https://api.calendly.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// ✅ Trust Proxy for HTTPS
app.set('trust proxy', true);

// ✅ Static Files
app.use('/uploads', express.static('uploads'));




// ✅ Use raw body ONLY for Zoom validation events
app.use("/api/zoom/webhook", (req, res, next) => {
  if (req.headers["content-type"] === "application/json") {
      bodyParser.raw({ type: "application/json" })(req, res, next);
  } else {
      express.json()(req, res, next);
  }
});



// ========================= Error Handling Middleware =======================
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});


// ✅ Register Webhook Routes Early
app.use("/api/webhook", express.json()); // Middleware for Calendly JSON parsing


// // ✅ Remove Manual Header Setting (Fixes conflict)
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true"); // ✅ Ensure credentials are allowed
//   next();
// });

// // ✅ Handle Preflight Requests Properly
// app.options("*", cors());


const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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
      return res.json({ success: true, message: "OTP Verified Successfully!" });
    } else {
      return res.status(400).json({ error: "Invalid OTP or OTP expired." });
    }
  });
  async function fixMongoIndexes() {
    try {
      const db = mongoose.connection.db;
  
      console.log("🔧 Running MongoDB Index Fix...");
  
      // Drop existing coupon index and recreate it with sparse option
      await db.collection("registers").dropIndex("coupons.code_1").catch(err => console.warn("⚠️ No existing index for coupons.code"));
      console.log("✅ Dropped old coupons.code_1 index");
  
      // Recreate coupons.code index with sparse
      await db.collection("registers").createIndex({ "coupons.code": 1 }, { unique: true, sparse: true });
      console.log("✅ Created new sparse index on coupons.code");
  
      // 🛑 Drop existing `calendlyBookings.eventId_1` index
      await db.collection("registers").dropIndex("calendlyBookings.eventId_1").catch(err => console.warn("⚠️ No existing index for calendlyBookings.eventId"));
      console.log("✅ Dropped old calendlyBookings.eventId_1 index");
  
      // ✅ Recreate `calendlyBookings.eventId` index with sparse
      await db.collection("registers").createIndex({ "calendlyBookings.eventId": 1 }, { unique: true, sparse: true });
      console.log("✅ Created new sparse index on calendlyBookings.eventId");
  
      // 🛑 Drop existing `bookedSessions.calendlyEventUri_1` index
      await db.collection("registers").dropIndex("bookedSessions.calendlyEventUri_1").catch(err => console.warn("⚠️ No existing index for bookedSessions.calendlyEventUri"));
      console.log("✅ Dropped old bookedSessions.calendlyEventUri_1 index");
  
      // ✅ Recreate `bookedSessions.calendlyEventUri` index with sparse
      await db.collection("registers").createIndex({ "bookedSessions.calendlyEventUri": 1 }, { unique: true, sparse: true });
      console.log("✅ Created new sparse index on bookedSessions.calendlyEventUri");
  
      // 🛑 Drop existing `zoomBookings.zoomMeetingId_1` index to fix duplicate error
      await db.collection("registers").dropIndex("zoomBookings.zoomMeetingId_1").catch(err => console.warn("⚠️ No existing index for zoomBookings.zoomMeetingId"));
      console.log("✅ Dropped old zoomBookings.zoomMeetingId_1 index");
  
      // ✅ Recreate `zoomBookings.zoomMeetingId` index with sparse (to prevent null duplicates)
      await db.collection("registers").createIndex(
        { "zoomBookings.zoomMeetingId": 1 },
        { unique: true, sparse: true }
      );
      console.log("✅ Created new sparse index on zoomBookings.zoomMeetingId");
  
      // 🛑 Fix duplicate `paymentIntentId` in `stripepayments` collection
      console.log("🔧 Checking for duplicate paymentIntentId in stripepayments...");
      const duplicateCheck = await db.collection('stripepayments').aggregate([
        { $group: { _id: "$paymentIntentId", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
  
      if (duplicateCheck.length > 0) {
        console.log("⚠️ Found duplicate paymentIntentId. Resolving duplicates...");
        for (let duplicate of duplicateCheck) {
          // You can log and handle duplicates here, for example:
          console.log(`Duplicate found for paymentIntentId: ${duplicate._id}`);
          // You may choose to delete or merge duplicates here.
          await db.collection('stripepayments').deleteMany({ paymentIntentId: duplicate._id });
          console.log(`✅ Duplicates for paymentIntentId ${duplicate._id} resolved.`);
        }
      } else {
        console.log("🎉 No duplicates found for paymentIntentId.");
      }
  
      // ✅ Ensure unique index for paymentIntentId in `stripepayments`
      console.log("🔧 Ensuring unique index on paymentIntentId...");
      await db.collection('stripepayments').dropIndex('paymentIntentId_1').catch(err => console.warn("⚠️ No existing index for paymentIntentId"));
      await db.collection('stripepayments').createIndex({ paymentIntentId: 1 }, { unique: true });
      console.log("✅ Created unique index on paymentIntentId in stripepayments.");
  
      console.log("🎉 MongoDB Index Fix Completed!");
  
    } catch (error) {
      console.error("❌ Error updating MongoDB indexes:", error.message);
    }
  }
  
  // Run index fix when the app starts
  mongoose.connection.once("open", fixMongoIndexes);
11  
  


// Routes
app.use('/api/auth', authRoutes);
app.use("/api", subscribeRoute);
app.use('/api/contact', contactRoutes);
app.use("/api/stripe", stripeRoutes); // Set up route
app.use("/api", registerRoutes);
app.use("/api", userRoutes);
app.use('/api/zoom', zoomRoutes);
// ✅ **Use Webhook Route Properly**
// app.use("/api/otp", otpRoutes);
app.use('/api', proxyRoutes); // ✅ Use Proxy Routes
app.use("/api/webhook/calendly", webhookRoutes);
app.use("/api/webhook", webhookHandler);  // ✅ Handles both Calendly & Zoom
app.use("/api/admin", adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/consultation", consultationRoutes);
app.use("/api", waitlist);
app.use("/api/orders", ordersRoute); // ✅ Set orders route
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


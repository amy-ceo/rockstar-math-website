require("dotenv").config();
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "Loaded ✅" : "Not Loaded ❌");
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
connectDB();

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend's URL
    credentials: true,
}));


app.use(bodyParser.json());
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
  
// Routes
app.use('/api/auth', authRoutes);
app.use("/api/payment", paymentRoutes); // ✅ Use Payment Routes
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config()
console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'Loaded ✅' : 'Not Loaded ❌')

const express = require('express')
const http = require('http') // Required for Socket.IO
const { Server } = require('socket.io') // Required for Socket.IO
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const registerRoutes = require('./routes/registerRoutes')
const webhookRoutes = require('./routes/webhookRoutes')
const subscribeRoute = require('./routes/subscribeRoute')
const contactRoutes = require('./routes/contactRoutes')
const stripeRoutes = require('./routes/stripe') // Your Stripe route file
const twilio = require('twilio')
const zoomRoutes = require('./routes/zoomRoutes.js')
const consultationRoutes = require('./routes/consultationRoutes')
const waitlist = require('./routes/waitlist')
const userRoutes = require('./routes/userRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const ordersRoute = require('./routes/order.js')
const paypalRoutes = require('./routes/paypalRoutes.js')
const adminRoutes = require('./routes/adminRoutes') // Your admin routes
const blogRoutes = require('./routes/blogRoutes')
const bcrypt = require('bcryptjs')
const proxyRoutes = require('./routes/proxyRoutes')
const webhookHandler = require('./routes/webhookHandlerRoute.js')

if (!global.crypto) {
  global.crypto = require('crypto')
}
bcrypt.setRandomFallback((len) => global.crypto.randomBytes(len))

connectDB()
const app = express()

// Create HTTP server and integrate Socket.IO
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000', // Common React dev port
      'http://localhost:8080', // If your React app is served here
      'https://www.rockstarmath.com',
      'https://rockstarmath.com',
    ], // Adjust to your frontend URL(s)
    methods: ['GET', 'POST'],
  },
})

// Middleware to make io accessible in routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Stripe Webhook Middleware (raw body needed)
// This should come BEFORE general bodyParser.json() if webhook path is handled by a router loaded later
app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('🔔 Stripe Webhook Middleware Triggered for /api/stripe/webhook')
  next()
})

// General Middleware
app.use(bodyParser.json()) // For all other routes
app.use(bodyParser.urlencoded({ extended: true }))

// CORS Configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Added for React dev server
      'http://localhost:8080',
      'https://www.rockstarmath.com',
      'https://rockstarmath.com',
      'https://calendly.com',
      'https://api.calendly.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Important for Socket.IO if using cookies/auth
  }),
)

app.set('trust proxy', true)
app.use('/uploads', express.static('uploads'))

app.use('/api/zoom/webhook', (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    bodyParser.raw({ type: 'application/json' })(req, res, next)
  } else {
    express.json()(req, res, next)
  }
})

// Register Webhook Routes Early
app.use('/api/webhook', express.json()) // Middleware for Calendly JSON parsing

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
let otpStore = {}

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Phone number is required!' })
  const otp = Math.floor(100000 + Math.random() * 900000)
  try {
    const message = await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    console.log('OTP Sent:', message.sid)
    otpStore[phone] = otp
    res.json({ success: true, message: 'OTP Sent. Check console for OTP in dev.' /*, otp*/ }) // Remove OTP from prod response
  } catch (error) {
    console.error('Twilio Error:', error)
    res.status(500).json({ error: 'Failed to send OTP. Please check Twilio settings!' })
  }
})

app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required!' })
  if (otpStore[phone] && otpStore[phone] == otp) {
    delete otpStore[phone]
    return res.json({ success: true, message: 'OTP Verified Successfully!' })
  } else {
    return res.status(400).json({ error: 'Invalid OTP or OTP expired.' })
  }
})

async function fixMongoIndexes() {
  try {
    const db = mongoose.connection.db
    console.log('🔧 Running MongoDB Index Fix...')
    // ... (Your existing fixMongoIndexes function code) ...
    await db
      .collection('registers')
      .dropIndex('coupons.code_1')
      .catch((err) => console.warn('⚠️ No existing index for coupons.code_1'))
    await db
      .collection('registers')
      .createIndex({ 'coupons.code': 1 }, { unique: true, sparse: true })
    await db
      .collection('registers')
      .dropIndex('calendlyBookings.eventId_1')
      .catch((err) => console.warn('⚠️ No existing index for calendlyBookings.eventId_1'))
    await db
      .collection('registers')
      .createIndex({ 'calendlyBookings.eventId': 1 }, { unique: true, sparse: true })
    await db
      .collection('registers')
      .dropIndex('bookedSessions.calendlyEventUri_1')
      .catch((err) => console.warn('⚠️ No existing index for bookedSessions.calendlyEventUri_1'))
    await db
      .collection('registers')
      .createIndex({ 'bookedSessions.calendlyEventUri': 1 }, { unique: true, sparse: true })
    await db
      .collection('registers')
      .dropIndex('zoomBookings.zoomMeetingId_1')
      .catch((err) => console.warn('⚠️ No existing index for zoomBookings.zoomMeetingId_1'))
    await db
      .collection('registers')
      .createIndex({ 'zoomBookings.zoomMeetingId': 1 }, { unique: true, sparse: true })

    const duplicateCheck = await db
      .collection('stripepayments')
      .aggregate([
        { $group: { _id: '$paymentIntentId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray()
    if (duplicateCheck.length > 0) {
      console.log('⚠️ Found duplicate paymentIntentId. Resolving duplicates...')
      for (let duplicate of duplicateCheck) {
        console.log(`Duplicate found for paymentIntentId: ${duplicate._id}`)
        const paymentsToDelete = await db
          .collection('stripepayments')
          .find({ paymentIntentId: duplicate._id })
          .sort({ createdAt: 1 })
          .skip(1)
          .toArray() // Keep the oldest one
        const idsToDelete = paymentsToDelete.map((p) => p._id)
        if (idsToDelete.length > 0) {
          await db.collection('stripepayments').deleteMany({ _id: { $in: idsToDelete } })
          console.log(
            `✅ Resolved duplicates for paymentIntentId ${duplicate._id} by deleting ${idsToDelete.length} newer entries.`,
          )
        }
      }
    } else {
      console.log('🎉 No duplicates found for paymentIntentId in stripepayments.')
    }
    await db
      .collection('stripepayments')
      .dropIndex('paymentIntentId_1')
      .catch((err) => console.warn('⚠️ No existing index for paymentIntentId_1 in stripepayments'))
    await db.collection('stripepayments').createIndex({ paymentIntentId: 1 }, { unique: true })
    console.log('🎉 MongoDB Index Fix Completed!')
  } catch (error) {
    console.error('❌ Error updating MongoDB indexes:', error.message)
  }
}
mongoose.connection.once('open', fixMongoIndexes)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', subscribeRoute)
app.use('/api/contact', contactRoutes)
app.use('/api/stripe', stripeRoutes) // Stripe routes
app.use('/api', registerRoutes)
app.use('/api', userRoutes)
app.use('/api/zoom', zoomRoutes)
app.use('/api', proxyRoutes)
app.use('/api/webhook/calendly', webhookRoutes)
app.use('/api/webhook', webhookHandler)
app.use('/api/admin', adminRoutes) // Admin routes
app.use('/api/blogs', blogRoutes)
app.use('/api/paypal', paypalRoutes)
app.use('/api/consultation', consultationRoutes)
app.use('/api', waitlist)
app.use('/api/orders', ordersRoute)

// Socket.IO connection listener
io.on('connection', (socket) => {
  console.log('🔌 A user connected via WebSocket:', socket.id)
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id)
  })
  // You can add more specific event listeners here if needed
})

// Global Error Handling Middleware - MUST BE LAST
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err.stack || err) // Log stack for better debugging
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Optionally show stack in dev
    },
  })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} with WebSockets enabled`),
) // Use httpServer to listen

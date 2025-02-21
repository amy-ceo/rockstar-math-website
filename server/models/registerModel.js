const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const purchasedClassSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Product Name
  description: { type: String, required: true }, // Product Description
  purchaseDate: { type: Date, default: Date.now }, // Date of Purchase
  sessionCount: { type: Number, default: 0 }, // ✅ Number of Sessions (For Services)
  remainingSessions: { type: Number, default: 0 }, // ✅ Remaining Sessions (For Services)
  bookingLink: { type: String, default: null }, // ✅ Calendly Booking Link (For Services)
})

// ✅ Calendly Booking Schema (New Feature)
const calendlyBookingSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  eventType: { type: String, required: true }, // e.g., "90 minute session"
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})

// ✅ Coupon Schema Inside Register Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  percent_off: { type: Number, required: true },
  valid: { type: Boolean, default: true },
  assignedAt: { type: Date, default: Date.now },
})

// ✅ Define Schema
const RegisterSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, required: true },
    adultName: { type: String, required: true },
    numStudents: { type: Number, required: true },
    students: {
      type: [
        {
          name: { type: String, required: true },
          grade: { type: String, required: true },
          mathLevel: { type: String, required: true },
          age: { type: Number, required: true },
        },
      ],
      validate: {
        validator: function (students) {
          return students.length === this.numStudents // ✅ Ensure student array matches numStudents
        },
        message: 'Number of students does not match student details provided!',
      },
    },
    billingEmail: { type: String, required: true },
    schedulingEmails: { type: String, required: true },
    phone: { type: String, required: true },
    goals: { type: String, required: true },
    didUserApproveSMS: { type: Boolean, default: false },
    didUserApproveWebcam: { type: Boolean, default: false },

    // ✅ Password Reset Fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ✅ Store User Coupons
    coupons: [couponSchema],
    // ✅ Purchased Classes & Services
    purchasedClasses: [purchasedClassSchema], // ✅ Includes both Zoom & Service purchases
    // ✅ New: Calendly Bookings
    calendlyBookings: [calendlyBookingSchema],
    // ✅ Zoom Meeting Details (For Purchased Classes)
    zoomMeetings: [
      {
        meetingId: { type: String, required: true }, // Zoom Meeting ID
        topic: { type: String, required: true }, // Meeting Topic
        startTime: { type: Date, required: true }, // Start Time
        joinUrl: { type: String, required: true }, // User Join URL
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
)

// ✅ Password Hashing Before Saving
RegisterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  if (!this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  next()
})

// ✅ Match Password for Login
RegisterSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ✅ Generate Reset Password Token
RegisterSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex')
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  return resetToken
}

module.exports = mongoose.model('Register', RegisterSchema)

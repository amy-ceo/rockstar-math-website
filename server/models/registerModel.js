const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const purchasedClassSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Product Name
  description: { type: String, required: true }, // Product Description
  purchaseDate: { type: Date, default: Date.now }, // Date of Purchase
  sessionCount: { type: Number, required: true }, // ✅ Total Purchased
  remainingSessions: { type: Number, required: true }, // ✅ Sessions Left
  bookingLink: { type: String, default: null }, // ✅ Calendly Booking Link (For Services)
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Completed'],
    default: 'Active', // ✅ Automatically expires when sessions = 0
  },
})

const bookedSessionSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, // ✅ Event Name
  calendlyEventUri: { type: String, required: true, unique: true, sparse: true }, // ✅ Unique Event URI
  startTime: { type: Date, required: true }, // ✅ Event Start Time
  zoomMeetingLink: String, // ✅ Add Zoom Link
  endTime: { type: Date, required: false }, // ✅ Optional: End Time
  timezone: { type: String, required: false }, // ✅ Timezone (if available)
  // ✅ Event Status
  status: {
    type: String,
    enum: ['Booked', 'Completed', 'Cancelled', 'Active', 'Pushed', 'Rescheduled'], // ✅ Added "Rescheduled"
    default: 'Booked',
},
note: { type: String, default: "" }, // ✅ New Field for Notes  

  createdAt: { type: Date, default: Date.now }, // ✅ When Booking Was Stored
  updatedAt: { type: Date, required: false }, // ✅ When Last Updated
})

// ✅ Coupon Schema Inside Register Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, sparse: true }, // ✅ Fix added
  percent_off: { type: Number, required: true },
  valid: { type: Boolean, default: true },
  assignedAt: { type: Date, default: Date.now },
})

// ✅ Archived Classes Schema (Same as purchasedClasses)
const archivedClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  archivedAt: { type: Date, default: Date.now },
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
    // ✅ Archived Classes (New Feature)
    archivedClasses: [purchasedClassSchema], // ✅ Archived Classes
    // ✅ Store User Coupons
    coupons: [couponSchema],
    // ✅ Purchased Classes & Services
    purchasedClasses: [purchasedClassSchema], // ✅ Includes both Zoom & Service purchases
    // ✅ New: Calendly Bookings
    bookedSessions: [bookedSessionSchema], // ✅ This will store all booked sessions
  
  },
  { timestamps: true },
)

// ✅ Automatically Expire Classes When Sessions = 0
RegisterSchema.pre('save', function (next) {
  this.purchasedClasses.forEach((cls) => {
    if (cls.remainingSessions <= 0) {
      cls.status = 'Expired'
    }
  })
  next()
})

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

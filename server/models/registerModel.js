const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// ✅ Purchased Classes Schema (Tracks User’s Purchased Sessions)
const purchasedClassSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Plan Name (e.g., "8 x 30")
  description: { type: String, required: true }, // Plan Description
  totalSessions: { type: Number, required: true }, // e.g., 8, 3
  remainingSessions: { type: Number, required: true }, // Decreases on booking
  purchaseDate: { type: Date, default: Date.now }, // When Plan was Bought
  bookingLink: { type: String, default: null }, // Calendly Booking Link (if applicable)
  lastUpdated: { type: Date, default: Date.now } // Tracks Last Modification
});

// ✅ New: Purchased Session Tracking Schema
const purchasedSessionSchema = new mongoose.Schema({
  planName: { type: String, required: true }, // e.g. "8 x 30", "3 x 30"
  totalSessions: { type: Number, required: true }, // e.g. 8, 3
  remainingSessions: { type: Number, required: true }, // e.g. Starts with totalSessions, decreases on booking
  lastUpdated: { type: Date, default: Date.now } // ✅ Track when it was last modified
});


// ✅ Booked Sessions Schema (Tracks Individual Bookings)
const bookedSessionSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, // Event Name
  calendlyEventUri: { type: String, required: true, sparse: true }, // ✅ Removed `unique: true`
  startTime: { type: Date, required: true }, // Start Time
  endTime: { type: Date, required: false }, // End Time (if available)
  timezone: { type: String, required: false }, // Timezone (if available)
  
  // ✅ Updated Status Field for Better Tracking
  status: { 
    type: String, 
    enum: ["Booked", "Completed", "Cancelled", "Active", "Rescheduled", "Pushed"], 
    default: "Booked"
  },

  createdAt: { type: Date, default: Date.now }, // When Booking Was Stored
  updatedAt: { type: Date, default: Date.now } // When Last Updated
});
// ✅ Coupon Schema Inside Register Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, sparse: true }, // ✅ Fix added
  percent_off: { type: Number, required: true },
  valid: { type: Boolean, default: true },
  assignedAt: { type: Date, default: Date.now },
});


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
     // ✅ Purchased Sessions (NEW) - Tracks Remaining Sessions
     // ✅ Store User Coupons
     coupons: [couponSchema],
     // ✅ Purchased Classes & Services
     purchasedClasses: [purchasedClassSchema], // ✅ Includes both Zoom & Service purchases
     purchasedSessions: [purchasedSessionSchema], // ✅ This will track session-based purchases
     // ✅ New: Calendly Bookings
    bookedSessions: [bookedSessionSchema], // ✅ This will store all booked sessions
    // ✅ Zoom Meeting Details (For Purchased Classes)
    
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

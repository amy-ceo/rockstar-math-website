const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // ✅ Purchased Classes Field
  purchasedClasses: [
    {
      title: { type: String, required: true },
      teacher: { type: String, required: true },
      date: { type: String, required: true },
      image: { type: String },
      description: { type: String },
    }
  ],

  // ✅ Zoom Meeting Details
  zoomMeetings: [
    {
      meetingId: { type: String, required: true }, // Zoom Meeting ID
      topic: { type: String, required: true }, // Meeting Topic
      startTime: { type: Date, required: true }, // Start Time
      joinUrl: { type: String, required: true }, // User Join URL
      createdAt: { type: Date, default: Date.now }
    }
  ],

}, { timestamps: true });

// ✅ Password Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Method to Compare Passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Generate Reset Password Token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  return resetToken;
};

// ✅ Add Purchased Class (Helper Method)
UserSchema.methods.addPurchasedClass = async function (classData) {
  this.purchasedClasses.push(classData);
  await this.save();
  return this.purchasedClasses;
};

// ✅ Add Zoom Meeting (Helper Method)
UserSchema.methods.addZoomMeeting = async function (meetingData) {
  this.zoomMeetings.push(meetingData);
  await this.save();
  return this.zoomMeetings;
};

module.exports = mongoose.model('User', UserSchema);

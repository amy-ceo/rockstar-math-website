const Admin = require('../models/Admin')
const Register = require('../models/registerModel') // Correct Model for Users
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // Stripe API
const sendEmail = require('../utils/emailSender') // ✅ Use existing emailSender module
const crypto = require('crypto')
const mongoose = require("mongoose");
// ✅ Function to Check if userId is a Valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// ✅ Admin Login Function with Password Hash Check & Comparison

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ 1. Find Admin in Database
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log("❌ Admin not found for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("🔹 Found Admin:", admin.email);
    console.log("🔹 Stored Hashed Password:", admin.password);
    console.log("🔹 Entered Password:", password);

    // ✅ 2. Ensure Password is Properly Hashed Before Comparing
    if (!admin.password.startsWith("$2b$")) {
      console.log("⚠️ Password was NOT hashed before! Rehashing now...");

      // ✅ Hash and Save Password if it’s not already hashed
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
      await admin.save();

      console.log("✅ New Hashed Password Saved:", admin.password);
    }

    // ✅ 3. Compare Entered Password with Hashed Password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔑 Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password did not match");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ 4. Generate JWT Token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    console.log("✅ Admin Login Successful");
    res.status(200).json({
      message: "Admin Login Successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




exports.getAnalytics = async (req, res) => {
  try {
    // ✅ Fetch latest payments from Stripe
    const payments = await stripe.paymentIntents.list({ limit: 100 })

    let totalRevenue = 0
    let paymentMethods = {}
    let revenueTrends = {} // ✅ Store revenue per day
    let courseSales = {} // ✅ Store revenue per day

    payments.data.forEach((payment) => {
      if (payment.status === 'succeeded') {
        totalRevenue += payment.amount_received / 100 // Convert cents to dollars

        // ✅ Group revenue by date (Format: YYYY-MM-DD)
        const date = new Date(payment.created * 1000).toISOString().split('T')[0]
        revenueTrends[date] = (revenueTrends[date] || 0) + payment.amount_received / 100

        // ✅ Track Payment Methods
        const method = payment.payment_method_types[0] || 'unknown'
        paymentMethods[method] = (paymentMethods[method] || 0) + 1

        // ✅ Track Course Sales - Check if metadata exists
        if (payment.metadata && payment.metadata.courseName) {
          courseSales[payment.metadata.courseName] =
            (courseSales[payment.metadata.courseName] || 0) + 1
        } else {
          console.log(`⚠️ No courseName found in metadata for payment ID: ${payment.id}`)
        }
      }
    })

    // ✅ Format revenue trends for frontend
    const formattedRevenueTrends = Object.keys(revenueTrends).map((date) => ({
      date,
      amount: revenueTrends[date],
    }))

    // ✅ Fetch total users count from database
    const totalUsers = await Register.countDocuments()

    // ✅ Fetch users grouped by date for "New User Signups" chart
    const userSignupsData = await Register.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date (oldest to newest)
    ])

    // ✅ Format user signups for frontend
    const formattedUserSignups = userSignupsData.map((entry) => ({
      date: entry._id,
      count: entry.count,
    }))

    // ✅ Send response to frontend
    res.json({
      totalRevenue,
      totalUsers,
      courseSales: Object.keys(courseSales).map((course) => ({
        course,
        sales: courseSales[course],
      })),
      paymentMethods: Object.keys(paymentMethods).map((method) => ({
        method,
        count: paymentMethods[method],
      })),
      revenueTrends: formattedRevenueTrends,
      userSignups: formattedUserSignups,
    })
  } catch (error) {
    console.error('❌ Error fetching analytics:', error)
    res.status(500).json({ message: 'Error fetching analytics', error })
  }
}

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await Register.countDocuments() // ✅ Fetch total users

    // ✅ Fetch Stripe Payments (All Successful)
    const payments = await stripe.paymentIntents.list({ limit: 100 })

    // ✅ Filter Only Successful Payments
    const successfulPayments = payments.data.filter((payment) => payment.status === 'succeeded')

    // ✅ Calculate Total Revenue
    const totalRevenue = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0) / 100 // Convert from cents to dollars

    // ✅ Calculate Total Courses Sold (Assuming each payment = 1 course)
    const totalCoursesSold = successfulPayments.length

    res.json({ totalUsers, totalCoursesSold, totalRevenue })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ message: 'Error fetching stats', error })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Register.find()
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users.' })
  }
}

// ✅ Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, phone } = req.body

    const updatedUser = await Register.findByIdAndUpdate(
      id,
      { username, billingEmail: email, phone },
      { new: true },
    )

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' })
    }

    res.json({ success: true, message: 'User updated successfully.' })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user.' })
  }
}

// ✅ Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const deletedUser = await Register.findByIdAndDelete(id)

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' })
    }

    res.json({ success: true, message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user.' })
  }
}

exports.getStripePayments = async (req, res) => {
  try {
    const payments = await stripe.paymentIntents.list({ limit: 100 })
    res.json(payments.data)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error })
  }
}

exports.refundPayment = async (req, res) => {
  const { paymentId } = req.body
  try {
    await stripe.refunds.create({ payment_intent: paymentId })
    res.json({ message: 'Refund successful' })
  } catch (error) {
    res.status(500).json({ message: 'Refund failed', error })
  }
}

// ✅ 1️⃣ Request Password Reset (Admin)
exports.requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body
    const admin = await Admin.findOne({ email })

    if (!admin) {
      return res.status(400).json({ message: 'Admin with this email does not exist' })
    }

    // ✅ Generate Secure Token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // ✅ Hash Token before saving
    const salt = await bcrypt.genSalt(10)
    const hashedToken = await bcrypt.hash(resetToken, salt)

    admin.resetPasswordToken = hashedToken
    admin.resetPasswordExpires = Date.now() + 3600000 // Token expires in 1 hour

    await admin.save()

    console.log('🔹 Reset Token (Plain):', resetToken)
    console.log('🔹 Hashed Token Saved:', hashedToken)

    // ✅ Send Email with Reset Link
    const resetURL = `https://www.rockstarmath.com/admin/reset-password/${resetToken}`
    sendEmail(
      admin.email,
      'Password Reset Request',
      `Click here to reset your password: ${resetURL}`,
    )

    res.json({ message: 'Password reset link sent to email' })
  } catch (error) {
    console.error('Password Reset Request Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
// ✅ 2️⃣ Reset Password (Admin)
exports.resetAdminPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // ✅ Find Admin with Valid Token
    const admin = await Admin.findOne({ resetPasswordExpires: { $gt: Date.now() } });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // ✅ Verify Token with bcrypt.compare()
    const isTokenValid = await bcrypt.compare(token, admin.resetPasswordToken);

    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // ✅ FIX: Ensure password is hashed only once
    if (!admin.password.startsWith("$2b$")) {
      console.log("✅ Hashing new password before saving...");
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    } else {
      console.log("⚠️ Password was already hashed! Not rehashing.");
      admin.password = newPassword;
    }

    console.log("🔹 Hashed Password Being Saved:", admin.password);

    // ✅ Clear reset token fields
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();

    res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getAllBookedSessions = async (req, res) => {
  try {
    const users = await Register.find({}, "bookedSessions zoomBookings email username");

    let allSessions = [];

    users.forEach(user => {
      // ✅ Add Calendly Sessions
      user.bookedSessions.forEach(session => {
        allSessions.push({
          type: "calendly", // ✅ Identify as Calendly Session
          userId: user._id,
          userEmail: user.billingEmail,
          userName: user.username,
          sessionId: session._id,
          eventName: session.eventName,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          note: session.note || ""
        });
      });

      // ✅ Add Zoom Sessions
      user.zoomBookings.forEach(session => {
        session.sessionDates.forEach(date => {
          allSessions.push({
            type: "zoom", // ✅ Identify as Zoom Session
            userId: user._id,
            userEmail: user.billingEmail,
            userName: user.username,
            sessionId: session._id,
            eventName: session.eventName,
            startTime: date, // Zoom sessions have multiple dates
            endTime: date, // Assuming end time is the same
            status: "Confirmed",
            note: session.note || "",
            zoomMeetingLink: session.zoomMeetingLink || ""
          });
        });
      });
    });

    res.json({ success: true, sessions: allSessions });
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    res.status(500).json({ message: "Failed to fetch booked sessions" });
  }
};


exports.addOrUpdateZoomNote = async (req, res) => {
  try {
    const { userId, sessionId, startTime, note } = req.body;

    // ✅ Validate Input Fields
    if (!userId || !sessionId || !startTime || note === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // ✅ Find User
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Find the Zoom Session
    const session = user.zoomBookings.find(
      (session) => session._id.toString() === sessionId
    );

    if (!session) {
      return res.status(404).json({ error: "Zoom session not found" });
    }

    // ✅ Ensure the session date exists
    if (!session.sessionDates.includes(startTime)) {
      return res.status(404).json({ error: "Session date not found" });
    }

    // ✅ Save Note to Zoom Session
    session.note = note;

    // ✅ Save the updated document
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Zoom session note updated successfully!", updatedSession: session });
  } catch (error) {
    console.error("Error updating Zoom session note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.cancelSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    // ✅ Remove session from user's bookedSessions array
    const updatedUser = await Register.findByIdAndUpdate(
      userId,
      { $pull: { bookedSessions: { _id: sessionId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Send email notification to the user
    const emailSubject = "Your Scheduled Session Has Been Cancelled";
    const emailMessage = `Dear ${updatedUser.name},\n\nYour session has been cancelled by the admin. If you have any concerns, please contact support.\n\nBest regards,\nSupport Team`;

    await sendEmail(updatedUser.email, emailSubject, emailMessage);

    res.json({ success: true, message: "Session cancelled and email sent" });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).json({ message: "Failed to cancel session" });
  }
};




// ✅ DELETE NOTE FROM A BOOKED SESSION
exports.deleteNoteFromSession = async (req, res) => {
  try {
    const { userId, startTime } = req.body;

    // ✅ Validate Input Fields
    if (!userId || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // ✅ Find User
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Find the specific session in `bookedSessions`
    const session = user.bookedSessions.find(
      (session) => session.startTime.toISOString() === new Date(startTime).toISOString()
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // ✅ Remove the note
    session.note = ""; // Clear the note

    // ✅ Save the updated user document without validating `purchasedClasses`
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Note deleted successfully!", updatedSession: session });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// ✅ Add or Update Note to a Booked Session
exports.addOrUpdateNoteToSession = async (req, res) => {
  try {
    const { userId, startTime, note } = req.body;

    // ✅ Validate Input Fields
    if (!userId || !startTime || note === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // ✅ Find the user by ID
    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Find the session inside bookedSessions using startTime
    const session = user.bookedSessions.find(
      (session) => session.startTime.toISOString() === new Date(startTime).toISOString()
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // ✅ Update the note field
    session.note = note;

    // ✅ Save the updated user document without validating purchasedClasses
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Note updated successfully!', updatedSession: session });
  } catch (error) {
    console.error('Error adding/updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

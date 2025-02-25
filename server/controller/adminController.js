const Admin = require("../models/Admin");
const Register = require("../models/registerModel"); // Correct Model for Users
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Stripe API
const sendEmail = require("../utils/emailSender"); // ✅ Use existing emailSender module
const crypto = require("crypto");

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Admin Login Function with Password Hash Check & Comparison
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ Check if password is already hashed (bcrypt hashes start with "$2b$")
    if (!admin.password.startsWith("$2b$")) {
      console.log("⚠️ Unhashed password detected! Rehashing...");

      // ✅ Hash the password and update it in the database
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
      await admin.save();
    }

    // ✅ Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ Generate JWT token
    const token = generateToken(admin._id);

    // ✅ Send Response
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
    const payments = await stripe.paymentIntents.list({ limit: 100 });

    let totalRevenue = 0;
    let paymentMethods = {};
    let revenueTrends = {}; // ✅ Store revenue per day
    let courseSales = {}; // ✅ Store revenue per day



    payments.data.forEach((payment) => {
      if (payment.status === "succeeded") {
        totalRevenue += payment.amount_received / 100; // Convert cents to dollars

        // ✅ Group revenue by date (Format: YYYY-MM-DD)
        const date = new Date(payment.created * 1000).toISOString().split("T")[0];
        revenueTrends[date] = (revenueTrends[date] || 0) + payment.amount_received / 100;

        // ✅ Track Payment Methods
        const method = payment.payment_method_types[0] || "unknown";
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;

        // ✅ Track Course Sales - Check if metadata exists
        if (payment.metadata && payment.metadata.courseName) {
          courseSales[payment.metadata.courseName] = (courseSales[payment.metadata.courseName] || 0) + 1;
        } else {
          console.log(`⚠️ No courseName found in metadata for payment ID: ${payment.id}`);
        }
      }
    });

    // ✅ Format revenue trends for frontend
    const formattedRevenueTrends = Object.keys(revenueTrends).map((date) => ({
      date,
      amount: revenueTrends[date],
    }));

    // ✅ Fetch total users count from database
    const totalUsers = await Register.countDocuments();

    // ✅ Fetch users grouped by date for "New User Signups" chart
    const userSignupsData = await Register.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date (oldest to newest)
    ]);

    // ✅ Format user signups for frontend
    const formattedUserSignups = userSignupsData.map((entry) => ({
      date: entry._id,
      count: entry.count,
    }));

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
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics", error });
  }
};

exports.getAdminStats = async (req, res) => {
    try {
      const totalUsers = await Register.countDocuments(); // ✅ Fetch total users
  
      // ✅ Fetch Stripe Payments (All Successful)
      const payments = await stripe.paymentIntents.list({ limit: 100 });
  
      // ✅ Filter Only Successful Payments
      const successfulPayments = payments.data.filter(payment => payment.status === "succeeded");
  
      // ✅ Calculate Total Revenue
      const totalRevenue = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0) / 100; // Convert from cents to dollars
  
      // ✅ Calculate Total Courses Sold (Assuming each payment = 1 course)
      const totalCoursesSold = successfulPayments.length;
  
      res.json({ totalUsers, totalCoursesSold, totalRevenue });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Error fetching stats", error });
    }
  };

  exports.getAllUsers = async (req, res) => {
    try {
      const users = await Register.find();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users." });
    }
  };
  
  // ✅ Update User
  exports.updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, phone } = req.body;
  
      const updatedUser = await Register.findByIdAndUpdate(
        id,
        { username, billingEmail: email, phone },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }
  
      res.json({ success: true, message: "User updated successfully." });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user." });
    }
  };
  
  // ✅ Delete User
  exports.deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await Register.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.status(404).json({ error: "User not found." });
      }
  
      res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user." });
    }
  };

  exports.getStripePayments = async (req, res) => {
    try {
      const payments = await stripe.paymentIntents.list({ limit: 100 });
      res.json(payments.data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching payments', error });
    }
  };
  
  exports.refundPayment = async (req, res) => {
    const { paymentId } = req.body;
    try {
      await stripe.refunds.create({ payment_intent: paymentId });
      res.json({ message: 'Refund successful' });
    } catch (error) {
      res.status(500).json({ message: 'Refund failed', error });
    }
  };


// ✅ 1️⃣ Request Password Reset (Admin)
exports.requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ Check if Admin Exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // ✅ Generate Reset Token (Hashed)
    const resetToken = crypto.randomBytes(20).toString("hex");
    admin.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 min
    await admin.save();

    // ✅ Send Reset Email using `sendEmail`
    const resetUrl = `http://localhost:8080/admin/reset-password/${resetToken}`;
    const subject = "Admin Password Reset Request";
    const message = `
      <p>Hello ${admin.name},</p>
      <p>You requested a password reset. Click the link below to reset:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link expires in 10 minutes.</p>
    `;

    await sendEmail(admin.email, subject, "", message);
    res.json({ message: "Password reset email sent!" });

  } catch (error) {
    console.error("❌ Error requesting password reset:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ 2️⃣ Reset Password (Admin)
exports.resetAdminPassword = async (req, res) => {
  try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
          return res.status(400).json({ message: "New password is required" });
      }

      const admin = await Admin.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

      if (!admin) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;

      await admin.save();

      res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
      console.error("Password Reset Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
};
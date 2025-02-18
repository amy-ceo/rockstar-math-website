const Register = require('../models/registerModel') // ✅ Using Register Model
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const sendEmail = require('../utils/emailSender')
const crypto = require('crypto')


// // @desc    Register a new user
// // @route   POST /api/auth/signup
// exports.signup = async (req, res) => {
//   const { fullName, email, phoneNumber, password, confirmPassword } = req.body

//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match' })
//   }

//   try {
//     const userExists = await User.findOne({ email })
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' })
//     }

//     const newUser = new User({ email, phoneNumber, password, fullName })
//     await newUser.save()

//     // Send confirmation email
//     const subject = 'Welcome to Rockstar Math!'
//     const message = `
//      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #00008B; border: 1px solid #e0e0e0; border-radius: 10px;">
//        <div style="text-align: center; padding: 10px;">
//          <img src="https://scontent.flhe5-1.fna.fbcdn.net/v/t39.30808-6/442503438_957788876133590_2909592720330641516_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=_dgNhmagikUQ7kNvgF7yFq6&_nc_oc=Adhr6WCD8Nl5hiM9AQ1natQbVg_toEMzMqVnjaMr__V4XoY-MX0a4LKwhYr5eJigaBgxjmT1aETfgLzr7M-ieaVR&_nc_zt=23&_nc_ht=scontent.flhe5-1.fna&_nc_gid=A4Uh5Hdlx5SDIa1YcpDnRa3&oh=00_AYDj2m22g0-YYSOi9qqOvw0EWXp14czCwIw4M6zGGPB0cQ&oe=679A2D99" alt="Rockstar Math" style="height: 50px; margin-bottom: 20px;" />
//        </div>
//        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
//          <h1 style="color: #333333; text-align: center;">Welcome to Rockstar Math!</h1>
//          <p style="color: #555555; font-size: 16px; line-height: 1.6;">
//            Congratulations! You have successfully created an account with <strong>Rockstar Math</strong>.
//          </p>
//          <p style="color: #555555; font-size: 16px; line-height: 1.6;">
//            Explore step-by-step math courses, enhance your skills, and achieve results like never before.
//          </p>
//          <div style="text-align: center; margin: 20px 0;">
//            <a href="https://your-platform-url.com/login" target="_blank" style="display: inline-block; padding: 12px 20px; color: #ffffff; background-color: #ffc107; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
//              Start Exploring Now
//            </a>
//          </div>
//          <p style="color: #555555; font-size: 14px; line-height: 1.6; text-align: center;">
//            If you have any questions, feel free to <a href="https://your-platform-url.com/contact" style="color: #007bff; text-decoration: none;">contact us</a>.
//          </p>
//        </div>
//        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999999;">
//          © 2025 Rockstar Math. All rights reserved.
//        </div>
//      </div>
//    `

//     await sendEmail(email, subject, 'Welcome to Rockstar Math!', message)

//     res.status(201).json({ message: 'User registered successfully' })
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error', error: error.message })
//   }
// }

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // ✅ Find user by username
    const user = await Register.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // ✅ Check if password is already hashed (bcrypt hashes start with "$2b$")
    if (!user.password.startsWith("$2b$")) {
      console.log("⚠️ Unhashed password detected! Rehashing...");

      // ✅ Hash the password and update in database
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
    }

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // ✅ Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        billingEmail: user.billingEmail,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Save Purchased Class for User

// exports.addPurchasedClass = async (req, res) => {
//   try {
//     const { userId, classData } = req.body;

//     // ✅ Input Validation
//     if (!userId || !classData || !classData.name || !classData.description) {
//       return res.status(400).json({ message: "User ID and valid class data are required" });
//     }

//     console.log("🔹 Adding Purchased Class for User:", userId, "Class:", classData);

//     // ✅ Find User in Database
//     const user = await Register.findById(userId);
//     if (!user) {
//       console.error("❌ User not found:", userId);
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ Push New Class to `purchasedClasses` (Ensure it exists)
//     if (!user.purchasedClasses) {
//       user.purchasedClasses = [];
//     }

//     user.purchasedClasses.push({
//       name: classData.name,
//       description: classData.description,
//       purchaseDate: new Date().toISOString(), // ✅ Automatically set current date
//     });

//     await user.save();

//     console.log("✅ Class Added Successfully:", user.purchasedClasses);

//     res.status(200).json({
//       message: "Class added to user account",
//       purchasedClasses: user.purchasedClasses,
//     });
//   } catch (error) {
//     console.error("❌ Error adding class:", error.message);
//     res.status(500).json({ message: "Error adding class", error: error.message });
//   }
// };


// // ✅ Get User Purchased Classes
// exports.getPurchasedClasses = async (req, res) => {
//   try {
//     const user = await Register.findById(req.params.userId)
//     if (!user) return res.status(404).json({ message: 'User not found' })

//     res.json({ purchasedClasses: user.purchasedClasses || [] })
//   } catch (error) {
//     console.error('Error fetching purchased classes:', error)
//     res.status(500).json({ message: 'Server error' })
//   }
// }
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // ✅ Find user by email
    const user = await Register.findOne({ billingEmail: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

    await user.save(); // ✅ Save token in the database

    // ✅ Create reset URL
    const resetUrl = `http://localhost:8080/reset-password/${resetToken}`;

    // ✅ Send Reset Email
    const subject = "Password Reset Request";
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #00008B; border-radius: 10px;">
        <div style="text-align: center; padding: 10px;">
          <img src="https://scontent.flhe5-1.fna.fbcdn.net/v/t39.30808-6/442503438_957788876133590_2909592720330641516_n.jpg" alt="Rockstar Math" style="height: 50px; margin-bottom: 20px;" />
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
          <p style="color: #555555; font-size: 16px;">
            You requested a password reset. Please click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; color: #ffffff; background-color: #ffc107; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #555555; font-size: 14px;">
            Or copy and paste this link into your browser: <br />
            <a href="${resetUrl}" style="color: #007bff; text-decoration: none;">${resetUrl}</a>
          </p>
          <p style="color: #555555; font-size: 14px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999999;">
          © 2025 Rockstar Math. All rights reserved.
        </div>
      </div>
    `;

    await sendEmail(user.billingEmail, subject, "Reset Your Password", message);

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Reset Password - Change Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params; // Token from the URL
  const { password } = req.body; // New password from request

  try {
    // ✅ Hash the token to match database entry
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    // ✅ Find user by token and check expiration
    const user = await Register.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token isn't expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // ✅ Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // ✅ Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
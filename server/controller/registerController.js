const bcrypt = require('bcryptjs')
const Register = require('../models/registerModel')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendEmail = require("../utils/emailSender");

// ✅ Function to Generate JWT Token

// ✅ Define Zoom Course Names
const ZOOM_COURSES = ["Learn", "Achieve", "Excel"];

// ✅ Define Service Packages and Their Booking Limits
const SERVICE_PACKAGES = {
  "3x30": 3,
  "5x30": 5,
  "8x30": 8,
};

// ✅ Define Zoom Links (Static Links for Courses)
const ZOOM_LINKS = [
  "https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration",
  "https://us06web.zoom.us/meeting/register/kejThKqpTpetwaMNI33bAQ#/registration",
  "https://us06web.zoom.us/meeting/register/jH2N2rfMSXyqX1UDEZAarQ#/registration",
  "https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIYPw#/registration",
  "https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIT3Sfbpyg#/registration",
];

// ✅ Define Calendly Booking Links for Services
const CALENDLY_LINKS = {
  "3x30": "https://calendly.com/your-company/3-sessions",
  "5x30": "https://calendly.com/your-company/5-sessions",
  "8x30": "https://calendly.com/your-company/8-sessions",
};


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // Token valid for 7 days
}

exports.registerUser = async (req, res) => {
  try {
    let { username, password, numStudents, students, ...restData } = req.body;

    console.log("🔍 Incoming Registration Data:", req.body);

    // ✅ Convert username to lowercase
    username = username.toLowerCase();

    // ✅ Check if username already exists
    const existingUser = await Register.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Username already exists" });
    }
    bcrypt.setRandomFallback((size) => {
      const crypto = require("crypto");
      return crypto.randomBytes(size);
    });
    // ✅ Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🔹 Hashed Password:", hashedPassword);

    // ✅ Validate Students Data
    if (numStudents > 1) {
      if (!Array.isArray(students) || students.length !== numStudents) {
        return res.status(400).json({ success: false, error: "Invalid student details!" });
      }

      for (let i = 0; i < students.length; i++) {
        if (!students[i].name || !students[i].grade || !students[i].mathLevel || students[i].age === "") {
          return res.status(400).json({
            success: false,
            error: `Student ${i + 1} details are incomplete!`,
          });
        }
      }
    } else {
      if (!restData.studentNames || !restData.studentGrades || !restData.studentMathLevels) {
        return res.status(400).json({ success: false, error: "Student details are required!" });
      }
    }

    // ✅ Create New User Object
    const newUser = new Register({
      username,
      password: hashedPassword, // ✅ Securely storing hashed password
      numStudents,
      students:
        numStudents > 1
          ? students
          : [
              {
                name: restData.studentNames,
                grade: restData.studentGrades,
                mathLevel: restData.studentMathLevels,
                age: restData.studentAge,
              },
            ],
      ...restData,
    });

    // ✅ Save User in Database
    await newUser.save();

    // ✅ Generate JWT Token
    const token = generateToken(newUser._id);

    console.log("✅ Registration Successful:", newUser);

    // ✅ Response to Frontend
    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        _id: newUser._id,
        username: newUser.username,
        billingEmail: newUser.billingEmail,
        phone: newUser.phone,
      },
      token, // ✅ Sending token to frontend
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, error: "Registration failed. Please try again!" });
  }
};

// 🎯 Function to Handle Purchase
exports.addPurchasedClass = async (req, res) => {
  try {
    const { userId, purchasedItems, userEmail } = req.body;

    console.log("🔄 Processing Purchase Request...");

    if (!userId || !purchasedItems || !Array.isArray(purchasedItems) || purchasedItems.length === 0) {
      return res.status(400).json({ message: "Invalid request. Missing data." });
    }

    // ✅ Find User
    console.log(`🔎 Finding User: ${userId}`);
    const user = await Register.findById(userId);
    if (!user) {
      console.error("❌ User Not Found");
      return res.status(404).json({ message: "User not found." });
    }

    let newPurchases = [];
    let zoomCoursesPurchased = [];
    let servicePurchased = [];
    let acuityAppointments = [];

    let isCommonCorePurchased = false; // ✅ Flag for "Common Core- Parents"

    console.log("🛒 Processing Purchased Items...");
    for (const item of purchasedItems) {
      if (user.purchasedClasses.some(pc => pc.name === item.name)) {
        console.log(`⚠️ ${item.name} is already purchased, skipping...`);
        continue;
      }

      let newPurchase = {
        name: item.name,
        description: item.description || "No description available",
        purchaseDate: new Date(),
      };

      if (item.name === "Common Core- Parents") {
        isCommonCorePurchased = true; // ✅ Set flag
      } else if (ZOOM_COURSES.includes(item.name)) {
        zoomCoursesPurchased.push(item.name);
      }

      if (SERVICE_PACKAGES[item.name]) {
        newPurchase.sessionCount = SERVICE_PACKAGES[item.name];
        newPurchase.remainingSessions = SERVICE_PACKAGES[item.name];
        newPurchase.bookingLink = CALENDLY_LINKS[item.name];
        servicePurchased.push(item.name);
      }

      newPurchases.push(newPurchase);
    }

    console.log("📝 Updating User Purchases...");
    user.purchasedClasses.push(...newPurchases);
    await user.save();
    console.log("✅ Purchases Updated!");

    // ✅ Send Email for "Common Core- Parents"
    if (isCommonCorePurchased) {
      console.log(`📧 Sending Single Zoom Link Email to: ${userEmail}`);

      const commonCoreZoomLink = "https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration"; // ✅ Change to actual link

      let emailSubject = "🔗 Your Common Core- Parents Zoom Link";
      let emailHtml = `
        <h2>🎉 Hello ${user.username},</h2>
        <p>Thank you for purchasing the <strong>Common Core- Parents</strong> subscription!</p>
        <p>Here is your Zoom link for your upcoming session:</p>
        <p><a href="${commonCoreZoomLink}" target="_blank">${commonCoreZoomLink}</a></p>
        <p>We look forward to seeing you!</p>
      `;

      await sendEmail(userEmail, emailSubject, "", emailHtml);
      console.log("✅ Single Zoom link email sent!");
    }

    // ✅ Send Regular Zoom/Calendly Email if other courses were purchased
    if (zoomCoursesPurchased.length > 0 || servicePurchased.length > 0) {
      console.log(`📧 Sending purchase details email to: ${userEmail}`);

      let emailSubject = "🎉 Welcome! Your Purchase Details";
      let emailHtml = `<h2>🎉 Hello ${user.username},</h2><p>Thank you for your purchase.</p>`;

      if (zoomCoursesPurchased.length > 0) {
        emailHtml += `<h3>🔗 Here are your Zoom links:</h3><ul>${zoomCoursesPurchased.map(name => `<li><a href="${ZOOM_LINKS[name]}" target="_blank">${ZOOM_LINKS[name]}</a></li>`).join("")}</ul>`;
      }

      if (servicePurchased.length > 0) {
        emailHtml += `<h3>📅 Use the links below to book your sessions:</h3><ul>${servicePurchased.map(s => `<li><a href="${CALENDLY_LINKS[s]}" target="_blank">${CALENDLY_LINKS[s]}</a></li>`).join("")}</ul>`;
      }

      await sendEmail(userEmail, emailSubject, "", emailHtml);
      console.log("✅ Purchase details email sent successfully!");
    }

    // ✅ Send Welcome Email (same as before)
    console.log(`📧 Sending Welcome Email to: ${userEmail}`);

    let welcomeSubject = "Welcome to Rockstar Math - Important Tips for Your Upcoming Tutoring Session";
    let welcomeText = `Dear ${user.username},\n\nThank you for booking your session with Rockstar Math! I'm excited to work with you. Please review these tips for a smooth and productive online tutoring experience:\n\n🔹 **Stay Focused**\n🔹 **Show Your Work**\n🔹 **Screen Sharing**\n\nIf you have any questions, feel free to reach out.\n\nBest regards,\nAmy Gemme\nRockstar Math Tutoring\n📞 510-410-4963`;

    await sendEmail(userEmail, welcomeSubject, welcomeText, "");
    console.log("✅ Welcome email sent successfully!");

    return res.status(200).json({ message: "Purchase updated & all emails sent!" });

  } catch (error) {
    console.error("❌ Error processing purchase:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.getPurchasedClasses = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Fetching Purchased Classes for User ID:', userId);

    // ✅ Check if User Exists
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });;
    }

    // ✅ Ensure purchasedClasses is always an array
    const purchasedClasses = user.purchasedClasses || [];

    console.log("✅ Purchased Classes Retrieved:", purchasedClasses);

    return res.status(200).json({
      message: 'Purchased classes retrieved successfully!',
      purchasedClasses
    });
  } catch (error) {
    console.error('❌ Error Fetching Purchased Classes:', error);;
    res.status(500).json({ message: 'Server error', error: error.message });;
  }
};
// <<<<<<< HEAD
// =======

// >>>>>>> 8b2d483ae2020985b6fb2f2b384fdea021658088

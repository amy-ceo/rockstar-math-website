const bcrypt = require('bcryptjs')
const Register = require('../models/registerModel')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const cron = require("node-cron");
const sendEmail = require('../utils/emailSender')

// ✅ Function to Generate JWT Token

// ✅ Define Zoom Course Names
const ZOOM_COURSES = ['Learn', 'Achieve', 'Excel']

// ✅ Function to Automatically Archive Expired Classes
const archiveExpiredCalendlySessions = async () => {
  try {
    console.log("🔄 Running Calendly auto-archiving process...");

    const users = await Register.find();
    const currentDate = new Date();

    users.forEach(async (user) => {
      const expiredSessions = user.purchasedClasses.filter(
        (cls) => cls.bookingLink && new Date(cls.purchaseDate) < currentDate
      );

      if (expiredSessions.length > 0) {
        console.log(`📂 Archiving ${expiredSessions.length} expired Calendly sessions for ${user.username}`);

        user.archivedClasses.push(...expiredSessions);
        user.purchasedClasses = user.purchasedClasses.filter(
          (cls) => !(cls.bookingLink && new Date(cls.purchaseDate) < currentDate)
        );

        await user.save();
      }
    });

    console.log("✅ Auto-archiving of expired Calendly sessions completed!");
  } catch (error) {
    console.error("❌ Error auto-archiving Calendly sessions:", error);
  }
};

// ✅ Schedule the function to run daily at midnight
cron.schedule("0 0 * * *", archiveExpiredCalendlySessions);


// ✅ Define Service Packages and Their Booking Limits
const SERVICE_PACKAGES = {
  '3x30': 3,
  '5x30': 5,
  '8x30': 8,
}

// ✅ Define Zoom Links (Static Links for Courses)
const ZOOM_LINKS = [
  'https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration',
  'https://us06web.zoom.us/meeting/register/kejThKqpTpetwaMNI33bAQ#/registration',
  'https://us06web.zoom.us/meeting/register/jH2N2rfMSXyqX1UDEZAarQ#/registration',
  'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIYPw#/registration',
  'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIT3Sfbpyg#/registration',
]

// ✅ Define Calendly Booking Links for Services (Updated from Image)
const CALENDLY_LINKS = {
  '3x30': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '5x30': '60 minutes: https://calendly.com/rockstarmathtutoring/60min',
  '8x30': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
}

// ✅ Function to Generate Calendly Scheduling Link (If Needed)
// ✅ Function to Generate Calendly Link with Booking Limits
const generateCalendlyLink = async (userId, sessionType) => {
  try {
    const user = await Register.findById(userId);
    if (!user) return null;

    user.calendlyBookingsCount = user.calendlyBookingsCount || {}; // Ensure field exists
    const currentBookings = user.calendlyBookingsCount[sessionType] || 0;
    const maxBookings = SERVICE_PACKAGES[sessionType];

    // ✅ Prevent Overbooking
    if (currentBookings >= maxBookings) {
      console.warn(`⚠️ User ${userId} exceeded booking limit for ${sessionType}`);
      return null;
    }

    user.calendlyBookingsCount[sessionType] = currentBookings + 1;
    await user.save();

    console.log(`✅ Calendly Link Generated for ${sessionType}: ${CALENDLY_LINKS[sessionType]}`);
    return CALENDLY_LINKS[sessionType];
  } catch (error) {
    console.error("❌ Calendly Link Generation Failed:", error);
    return null;
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // Token valid for 7 days
}


exports.registerUser = async (req, res) => {
  try {
    let { username, password, numStudents, students, ...restData } = req.body;

    console.log('🔍 Incoming Registration Data:', req.body);

    // ✅ Convert username to lowercase
    username = username.toLowerCase();

    // ✅ Check if username already exists
    const existingUser = await Register.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    bcrypt.setRandomFallback((size) => {
      const crypto = require('crypto');
      return crypto.randomBytes(size);
    });

    // ✅ Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('🔹 Hashed Password:', hashedPassword);

    // ✅ Validate Students Data
    if (numStudents > 1) {
      if (!Array.isArray(students) || students.length !== numStudents) {
        return res.status(400).json({ success: false, error: 'Invalid student details!' });
      }

      for (let i = 0; i < students.length; i++) {
        if (
          !students[i].name ||
          !students[i].grade ||
          !students[i].mathLevel ||
          students[i].age === ''
        ) {
          return res.status(400).json({
            success: false,
            error: `Student ${i + 1} details are incomplete!`,
          });
        }
      }
    } else {
      if (!restData.studentNames || !restData.studentGrades || !restData.studentMathLevels) {
        return res.status(400).json({ success: false, error: 'Student details are required!' });
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

    console.log('✅ Registration Successful:', newUser);

    // ✅ Send Welcome Email
    try {
      const subject = `🎉 Welcome to Rockstar Math, ${newUser.username}!`;
      const htmlContent = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        
        <div style="text-align: center; padding-bottom: 20px;">
          <img src="https://your-logo-url.com/logo.png" alt="Rockstar Math" style="width: 150px; margin-bottom: 10px;">
          <h2 style="color: #2C3E50;">🎉 Welcome, ${newUser.username}!</h2>
          <p style="font-size: 16px;">We're thrilled to have you join <b>Rockstar Math</b>! 🚀</p>
        </div>
    
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #007bff;">📢 Your Account is Ready!</h3>
          <p>Congratulations! Your account has been successfully created. You now have access to personalized math tutoring, expert guidance, and interactive learning resources.</p>
          <p><b>Username:</b> ${newUser.username}</p>
          <p><b>Email:</b> ${newUser.email}</p>
        </div>
    
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #007bff;">📌 What's Next?</h3>
          <p>Start your learning journey today by logging into your dashboard, exploring available sessions, and scheduling your first class!</p>
          <p><b>Access your dashboard here:</b> <a href="https://your-website.com/login" target="_blank" style="color: #007bff;">Go to Dashboard</a></p>
        </div>
    
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #007bff;">💡 Need Help?</h3>
          <p>Our team is always here to assist you! If you have any questions, reach out to us at <b>support@rockstarmath.com</b>.</p>
        </div>
    
        <p style="text-align: center; font-size: 16px;">Let's make math learning fun and exciting! We can't wait to see you in class. 🚀</p>
    
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://calendly.com/rockstarmathtutoring" target="_blank"
            style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
            📅 Schedule Your First Session
          </a>
        </div>
    
        <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">
          Best regards,<br>
          <b>Amy Gemme</b><br>
          Rockstar Math Tutoring<br>
          📞 510-410-4963
        </p>
      </div>
    `;
    

      await sendEmail(newUser.billingEmail, subject, '', htmlContent);
      console.log('✅ Welcome email sent successfully!');
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
    }

    // ✅ Response to Frontend
    res.status(201).json({
      success: true,
      message: 'Registration successful! A welcome email has been sent.',
      user: {
        _id: newUser._id,
        username: newUser.username,
        billingEmail: newUser.billingEmail,
        phone: newUser.phone,
      },
      token, // ✅ Sending token to frontend
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again!' });
  }
};

// 🎯 Function to Handle Purchase
// 🎯 **Updated Purchase Function with Calendly Integration**
exports.addPurchasedClass = async (req, res) => {
  try {
    const { userId, purchasedItems, userEmail } = req.body;

    console.log('🔄 Processing Purchase Request...');

    if (!userId || !purchasedItems || !Array.isArray(purchasedItems) || purchasedItems.length === 0) {
      return res.status(400).json({ message: 'Invalid request. Missing data.' });
    }

    let couponCode = null;
    let discountPercent = 0;

    // ✅ Find User
    console.log(`🔎 Finding User: ${userId}`);
    const user = await Register.findById(userId);
    if (!user) {
      console.error('❌ User Not Found');
      return res.status(404).json({ message: 'User not found.' });
    }

    let newPurchases = [];
    let zoomCoursesPurchased = [];
    let servicePurchased = [];
    let calendlyMeetingLink = null; // Store Calendly link if required

    console.log('🛒 Processing Purchased Items...');
    for (const item of purchasedItems) {
      if (user.purchasedClasses.some((pc) => pc.name === item.name)) {
        console.log(`⚠️ ${item.name} is already purchased, skipping...`);
        continue;
      }

      let newPurchase = {
        name: item.name,
        description: item.description || 'No description available',
        purchaseDate: new Date(),
      };

      if (ZOOM_COURSES.includes(item.name)) {
        zoomCoursesPurchased.push(item.name);
      }

      if (SERVICE_PACKAGES[item.name]) {
        newPurchase.sessionCount = SERVICE_PACKAGES[item.name];
        newPurchase.remainingSessions = SERVICE_PACKAGES[item.name];

        // 🎯 Generate Calendly Link if it's `5x30` or `8x30`
        if (item.name === '5x30' || item.name === '8x30') {
          console.log(`📅 Assigning Calendly Link for: ${item.name}`);
          calendlyMeetingLink = await generateCalendlyLink(userId, item.name);
          if (calendlyMeetingLink) {
            newPurchase.bookingLink = calendlyMeetingLink;
          } else {
            console.warn(`❌ Booking Limit Exceeded for ${item.name}`);
            return res.status(400).json({
              message: `You have reached the booking limit for ${item.name}.`,
            });
          }
        }

        servicePurchased.push(item.name);
      }

      // 🎟 Assign Coupon Based on Purchased Plan
      if (purchasedItems.some((item) => item.name === 'Learn')) {
        couponCode = 'URem36bx';
        discountPercent = 10;
      } else if (purchasedItems.some((item) => item.name === 'Achieve')) {
        couponCode = 'G4R1If1p';
        discountPercent = 30;
      } else if (purchasedItems.some((item) => item.name === 'Excel')) {
        couponCode = 'mZybTHmQ';
        discountPercent = 20;
      }

      // ✅ Store Coupon Inside User's Register Model
      if (couponCode) {
        user.coupons.push({ code: couponCode, percent_off: discountPercent });
        await user.save();
      }

      newPurchases.push(newPurchase);
    }

    console.log('📝 Updating User Purchases...');
    user.purchasedClasses.push(...newPurchases);
    await user.save();
    console.log('✅ Purchases Updated!');

    // ✅ Send Zoom/Calendly Email + Coupon Code
    if (zoomCoursesPurchased.length > 0 || servicePurchased.length > 0 || calendlyMeetingLink || couponCode) {
      console.log(`📧 Sending purchase details email to: ${userEmail}`);

      let emailSubject = '🎉 Welcome! Your Purchase Details';
      let emailHtml = `<h2>🎉 Hello ${user.username},</h2><p>Thank you for your purchase.</p>`;

      if (zoomCoursesPurchased.length > 0) {
        emailHtml += `<h3>🔗 Here are your Zoom links:</h3><ul>`;
        ZOOM_LINKS.forEach((link) => {
          emailHtml += `<li><a href="${link}" target="_blank">${link}</a></li>`;
        });
        emailHtml += `</ul>`;
      }

      if (servicePurchased.length > 0) {
        emailHtml += `<h3>📅 Use the links below to book your sessions:</h3><ul>${servicePurchased
          .map((s) => `<li><a href="${CALENDLY_LINKS[s]}" target="_blank">${CALENDLY_LINKS[s]}</a></li>`)
          .join('')}</ul>`;
      }

      // ✅ If Calendly Link Generated, Add to Email
      if (calendlyMeetingLink) {
        emailHtml += `<h3>📅 Click below to schedule your session:</h3><p><a href="${calendlyMeetingLink}" target="_blank">${calendlyMeetingLink}</a></p>`;
      }

      // 🎟 Add Coupon Code to Email
      if (couponCode) {
        emailHtml += `<h3>🎟 Your Exclusive Discount Coupon:</h3><p><b>Coupon Code:</b> ${couponCode}</p>`;
      }

      await sendEmail(userEmail, emailSubject, '', emailHtml);
      console.log('✅ Purchase details email sent successfully!');
    }

    // ✅ Send Welcome Email Always
    console.log(`📧 Sending Welcome Email to: ${userEmail}`);
    let welcomeSubject = `🎉 Welcome to Rockstar Math, ${user.username}!`;
    let welcomeHtml = `
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="https://your-logo-url.com/logo.png" alt="Rockstar Math" style="width: 150px; margin-bottom: 10px;">
        <h2 style="color: #2C3E50;">🎉 Welcome to Rockstar Math, ${user.username}!</h2>
        <p style="font-size: 16px;">Thank you for booking your session with <b>Rockstar Math!</b> I'm excited to work with you. To ensure we make the most of our time together, please review these important tips:</p>
      </div>
  
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">📌 Stay Focused</h3>
        <p>In today’s digital world, distractions are everywhere. To help keep us both focused, I kindly ask that you <b>keep your camera on</b> during the session whenever possible.</p>
      </div>
  
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">📌 Show Your Work</h3>
        <p>As your tutor, it’s crucial for me to observe how you’re working through math problems so I can better assist you. Here are a few ways you can share your work:</p>
        <ul style="padding-left: 20px;">
          <li>✅ <b>Zoom Whiteboard:</b> If you plan to use the Zoom whiteboard, I recommend a <b>large-screen tablet</b> with a touchscreen or a laptop with a digital pen for natural writing.</li>
          <li>✅ <b>Document Camera Alternative:</b> If you don’t have a document camera, consider using a <b>phone holder</b> (available for under $20 on Amazon) to point your phone’s camera at your paper while you write.</li>
        </ul>
      </div>
  
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">📌 Homework & Screen Sharing</h3>
        <p>If your homework is online and you plan to share your screen, please use a <b>touchscreen device (other than a mobile phone)</b> for easier interaction.</p>
        <p>Having a clear way to share your work is essential for me to provide the best guidance possible.</p>
      </div>
  
      <p style="text-align: center; font-size: 16px;">If you have any questions or need further recommendations, feel free to reach out. I look forward to helping you on your math journey!</p>
  
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://calendly.com/rockstarmathtutoring" target="_blank"
          style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
          📅 Book Your Next Session
        </a>
      </div>
  
      <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">
        Best regards,<br>
        <b>Amy Gemme</b><br>
        Rockstar Math Tutoring<br>
        📞 510-410-4963
      </p>
    </div>
  `;
  

    await sendEmail(userEmail, welcomeSubject, '', welcomeHtml);
    console.log('✅ Welcome email sent successfully!');

    return res.status(200).json({ message: 'Purchase updated & all emails sent!' });
  } catch (error) {
    console.error('❌ Error processing purchase:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getPurchasedClasses = async (req, res) => {
  try {
    const { userId } = req.params

    console.log('🔍 Fetching Purchased Classes for User ID:', userId)

    // ✅ Check if User Exists
    const user = await Register.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Ensure purchasedClasses is always an array
    const purchasedClasses = user.purchasedClasses || []

    console.log('✅ Purchased Classes Retrieved:', purchasedClasses)

    return res.status(200).json({
      message: 'Purchased classes retrieved successfully!',
      purchasedClasses,
    })
  } catch (error) {
    console.error('❌ Error Fetching Purchased Classes:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


exports.getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ coupons: user.coupons });
  } catch (error) {
    console.error("❌ Error fetching coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Archive a Class
exports.archiveClass = async (req, res) => {
  try {
    const { userId, className } = req.body;
    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the class to archive
    const classToArchive = user.purchasedClasses.find((c) => c.name === className);
    if (!classToArchive) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove from purchasedClasses and add to archivedClasses
    user.purchasedClasses = user.purchasedClasses.filter((c) => c.name !== className);
    user.archivedClasses.push(classToArchive);
    
    await user.save();
    
    res.status(200).json({ message: 'Class archived successfully!' });
  } catch (error) {
    console.error('❌ Error archiving class:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ Fetch Archived Classes
exports.getArchivedClasses = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📂 Fetching Archived Classes for User ID:', userId);

    const user = await Register.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ archivedClasses: user.archivedClasses || [] });
  } catch (error) {
    console.error('❌ Error fetching archived classes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Restore a Class
exports.restoreClass = async (req, res) => {
  try {
    const { userId, className } = req.body;

    if (!userId || !className) return res.status(400).json({ message: "Invalid request data." });

    const user = await Register.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const archivedClassIndex = user.archivedClasses.findIndex((c) => c.name === className);
    if (archivedClassIndex === -1) return res.status(404).json({ message: "Class not found in archive." });

    let restoredClass = user.archivedClasses[archivedClassIndex];
    if (!restoredClass.name || !restoredClass.description) {
      return res.status(400).json({ message: "Class data is incomplete, cannot restore." });
    }

    user.archivedClasses.splice(archivedClassIndex, 1);
    user.purchasedClasses.push({
      name: restoredClass.name,
      description: restoredClass.description,
      purchaseDate: restoredClass.purchaseDate || new Date(),
      sessionCount: restoredClass.sessionCount || 0,
      remainingSessions: restoredClass.remainingSessions || 0,
      bookingLink: restoredClass.bookingLink || null,
    });

    await user.save();

    res.status(200).json({ message: "Class restored successfully!" });
  } catch (error) {
    console.error("❌ Error restoring class:", error);
    res.status(500).json({ message: "Server error" });
  }
};

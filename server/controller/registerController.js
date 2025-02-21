const bcrypt = require('bcryptjs')
const Register = require('../models/registerModel')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendEmail = require('../utils/emailSender')

// ✅ Function to Generate JWT Token

// ✅ Define Zoom Course Names
const ZOOM_COURSES = ['Learn', 'Achieve', 'Excel']

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
  '3x30': 'https://calendly.com/rockstarmathtutoring/30min',
  '5x30': 'https://calendly.com/rockstarmathtutoring/60min',
  '8x30': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
}

// ✅ Function to Generate Calendly Scheduling Link (If Needed)
const generateCalendlyLink = async (sessionType) => {
  try {
    if (CALENDLY_LINKS[sessionType]) {
      return CALENDLY_LINKS[sessionType] // 📌 Return pre-defined Calendly link
    }
    return null
  } catch (error) {
    console.error('❌ Calendly Link Generation Failed: ', error)
    return null
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // Token valid for 7 days
}

exports.registerUser = async (req, res) => {
  try {
    let { username, password, numStudents, students, ...restData } = req.body

    console.log('🔍 Incoming Registration Data:', req.body)

    // ✅ Convert username to lowercase
    username = username.toLowerCase()

    // ✅ Check if username already exists
    const existingUser = await Register.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already exists' })
    }
    bcrypt.setRandomFallback((size) => {
      const crypto = require('crypto')
      return crypto.randomBytes(size)
    })
    // ✅ Hash Password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    console.log('🔹 Hashed Password:', hashedPassword)

    // ✅ Validate Students Data
    if (numStudents > 1) {
      if (!Array.isArray(students) || students.length !== numStudents) {
        return res.status(400).json({ success: false, error: 'Invalid student details!' })
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
          })
        }
      }
    } else {
      if (!restData.studentNames || !restData.studentGrades || !restData.studentMathLevels) {
        return res.status(400).json({ success: false, error: 'Student details are required!' })
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
    })

    // ✅ Save User in Database
    await newUser.save()

    // ✅ Generate JWT Token
    const token = generateToken(newUser._id)

    console.log('✅ Registration Successful:', newUser)

    // ✅ Response to Frontend
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        _id: newUser._id,
        username: newUser.username,
        billingEmail: newUser.billingEmail,
        phone: newUser.phone,
      },
      token, // ✅ Sending token to frontend
    })
  } catch (error) {
    console.error('❌ Registration Error:', error)
    res.status(500).json({ success: false, error: 'Registration failed. Please try again!' })
  }
}

// 🎯 Function to Handle Purchase
// 🎯 **Updated Purchase Function with Calendly Integration**
exports.addPurchasedClass = async (req, res) => {
  try {
    const { userId, purchasedItems, userEmail } = req.body

    console.log('🔄 Processing Purchase Request...')

    if (
      !userId ||
      !purchasedItems ||
      !Array.isArray(purchasedItems) ||
      purchasedItems.length === 0
    ) {
      return res.status(400).json({ message: 'Invalid request. Missing data.' })
    }

    let couponCode = null
    let discountPercent = 0
    // ✅ Find User
    console.log(`🔎 Finding User: ${userId}`)
    const user = await Register.findById(userId)
    if (!user) {
      console.error('❌ User Not Found')
      return res.status(404).json({ message: 'User not found.' })
    }

    let newPurchases = []
    let zoomCoursesPurchased = []
    let servicePurchased = []
    let calendlyMeetingLink = null // Store Calendly link if required

    console.log('🛒 Processing Purchased Items...')
    for (const item of purchasedItems) {
      if (user.purchasedClasses.some((pc) => pc.name === item.name)) {
        console.log(`⚠️ ${item.name} is already purchased, skipping...`)
        continue
      }

      let newPurchase = {
        name: item.name,
        description: item.description || 'No description available',
        purchaseDate: new Date(),
      }

      if (ZOOM_COURSES.includes(item.name)) {
        zoomCoursesPurchased.push(item.name)
      }

      if (SERVICE_PACKAGES[item.name]) {
        newPurchase.sessionCount = SERVICE_PACKAGES[item.name]
        newPurchase.remainingSessions = SERVICE_PACKAGES[item.name]

        // 🎯 Generate Calendly Link if it's `5x30` or `8x30`
        if (item.name === '5x30' || item.name === '8x30') {
          console.log(`📅 Assigning Calendly Link for: ${item.name}`)
          calendlyMeetingLink = await generateCalendlyLink(item.name)
          if (calendlyMeetingLink) {
            newPurchase.bookingLink = calendlyMeetingLink
          }
        }

        servicePurchased.push(item.name)
      }

      // 🎟 Assign Coupon Based on Purchased Plan
      if (purchasedItems.some((item) => item.name === 'Learn')) {
        couponCode = 'URem36bx'
        discountPercent = 10
      } else if (purchasedItems.some((item) => item.name === 'Achieve')) {
        couponCode = 'G4R1If1p'
        discountPercent = 30
      } else if (purchasedItems.some((item) => item.name === 'Excel')) {
        couponCode = 'mZybTHmQ'
        discountPercent = 20
      }

      // ✅ Store Coupon Inside User's Register Model
      if (couponCode) {
        user.coupons.push({ code: couponCode, percent_off: discountPercent })
        await user.save()
      }

      newPurchases.push(newPurchase)
    }

    console.log('📝 Updating User Purchases...')
    user.purchasedClasses.push(...newPurchases)
    await user.save()
    console.log('✅ Purchases Updated!')

    // ✅ Send Zoom/Calendly Email + Coupon Code
    if (
      zoomCoursesPurchased.length > 0 ||
      servicePurchased.length > 0 ||
      calendlyMeetingLink ||
      couponCode
    ) {
      console.log(`📧 Sending purchase details email to: ${userEmail}`)

      let emailSubject = '🎉 Welcome! Your Purchase Details'
      let emailHtml = `<h2>🎉 Hello ${user.username},</h2><p>Thank you for your purchase.</p>`

      if (zoomCoursesPurchased.length > 0) {
        emailHtml += `<h3>🔗 Here are your Zoom links:</h3><ul>`
        ZOOM_LINKS.forEach((link) => {
          emailHtml += `<li><a href="${link}" target="_blank">${link}</a></li>`
        })
        emailHtml += `</ul>`
      }

      if (servicePurchased.length > 0) {
        emailHtml += `<h3>📅 Use the links below to book your sessions:</h3><ul>${servicePurchased
          .map(
            (s) =>
              `<li><a href="${CALENDLY_LINKS[s]}" target="_blank">${CALENDLY_LINKS[s]}</a></li>`,
          )
          .join('')}</ul>`
      }

      // ✅ If Calendly Link Generated, Add to Email
      if (calendlyMeetingLink) {
        emailHtml += `<h3>📅 Click below to schedule your session:</h3><p><a href="${calendlyMeetingLink}" target="_blank">${calendlyMeetingLink}</a></p>`
      }

      // 🎟 Add Coupon Code to Email
      if (couponCode) {
        emailHtml += `<h3>🎟 Your Exclusive Discount Coupon:</h3><p><b>Coupon Code:</b> ${couponCode}</p>`
      }

      let welcomeSubject =
        'Welcome to Rockstar Math - Important Tips for Your Upcoming Tutoring Session'
      let welcomeText = `
  Dear ${user.username},
  
  Thank you for booking your session with Rockstar Math! I'm excited to work with you. To ensure we make the most of our time together, please take a moment to review these tips for a smooth and productive online tutoring experience:
  
  🔹 **Stay Focused**: Keep distractions minimal by turning your camera on during the session whenever possible.
  
  🔹 **Show Your Work**: I need to see how you solve problems to help you better:
     - Use a **Zoom Whiteboard** (best with a touchscreen tablet or laptop with a digital pen).
     - Use a **document camera** or a **phone holder** to show your paper while you write.
  
  🔹 **Screen Sharing**: If your homework is online, use a **touchscreen device (not a mobile phone)** for better interaction.
  
  Having a clear way to share your work is essential for me to provide the best guidance possible.
  
  If you have any questions, feel free to reach out. I look forward to helping you on your math journey!
  
  Best regards,  
  Amy Gemme  
  Rockstar Math Tutoring  
  📞 510-410-4963
      `

      let welcomeHtml = `
      <div style="background-color: #f9fafb; padding: 20px; font-family: Arial, sans-serif; color: #333;">
        
        <!-- Container -->
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    
          <!-- Header Section -->
          <div style="text-align: center; border-bottom: 3px solid #00008B; padding-bottom: 10px;">
            <img src="https://lh3.googleusercontent.com/E4_qZbXYrWVJzqYKoVRZExsZyUHewJ5P9Tkds6cvoXXlturq57Crg1a-7xtiGFVJFM1MB-yDWalHjXrb1tOFYs0=w16383" alt="Rockstar Math Logo" style="width: 120px; margin-bottom: 10px;">
            <h2 style="color: #00008B; font-size: 24px;">🎉 Welcome to Rockstar Math, ${user.username}!</h2>
          </div>
    
          <!-- Body Content -->
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Thank you for booking your session with <strong>Rockstar Math</strong>! I'm excited to work with you. To ensure we make the most of our time together, please take a moment to review these important tips:</p>
    
            <h3 style="color: #00008B; font-size: 18px; margin-top: 15px;">🔹 Stay Focused</h3>
            <p>Keep distractions minimal by turning your camera on during the session whenever possible.</p>
    
            <h3 style="color: #00008B; font-size: 18px; margin-top: 15px;">🔹 Show Your Work</h3>
            <p>It’s crucial for me to see how you solve problems so I can guide you better:</p>
            <ul style="list-style: none; padding-left: 0;">
              <li style="margin-bottom: 5px;">✅ Use the <strong>Zoom Whiteboard</strong> (best with a touchscreen tablet or laptop with a digital pen).</li>
              <li style="margin-bottom: 5px;">✅ Use a <strong>document camera</strong> or a <strong>phone holder</strong> to position your phone camera over your paper while writing.</li>
            </ul>
    
            <h3 style="color: #00008B; font-size: 18px; margin-top: 15px;">🔹 Screen Sharing</h3>
            <p>If your homework is online, use a <strong>touchscreen device (other than a mobile phone)</strong> for better interaction.</p>
    
            <p style="margin-top: 15px;">Having a clear way to share your work ensures I can provide the best guidance possible.</p>
    
            <p>If you have any questions, feel free to reach out. I look forward to helping you on your math journey!</p>
    
            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://rockstarmath.com/book-session" style="display: inline-block; background: #00008B; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">📅 Book Your Next Session</a>
            </div>
    
          </div>
    
          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
            <p><strong>Best regards,</strong><br>
            Amy Gemme<br>
            Rockstar Math Tutoring<br>
            📞 510-410-4963</p>
            <p>Follow us on: <a href="#" style="color: #00008B; text-decoration: none;">Facebook</a> | <a href="#" style="color: #00008B; text-decoration: none;">Twitter</a></p>
          </div>
    
        </div>
      </div>
    `

      console.log(`📧 Sending welcome email to: ${userEmail}`)

      await sendEmail(userEmail, emailSubject, '', emailHtml)

      console.log('✅ Welcome email sent successfully!')
    }

    return res.status(200).json({ message: 'Purchase updated & all emails sent!' })
  } catch (error) {
    console.error('❌ Error processing purchase:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

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
    const { userId } = req.params
    const user = await Register.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ coupons: user.coupons })
  } catch (error) {
    console.error('❌ Error fetching coupons:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

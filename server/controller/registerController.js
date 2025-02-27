const bcrypt = require('bcryptjs')
const Register = require('../models/registerModel')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const cron = require('node-cron')
const sendEmail = require('../utils/emailSender')
const stripe = require('stripe')(
  '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',
) // 🛑 Replace with your actual Stripe Secret Key

// ✅ Coupans
async function getActiveCoupons() {
  try {
    const coupons = await stripe.coupons.list({ limit: 100 }) // Fetch latest coupons

    let activeCoupons = coupons.data
      .filter((coupon) => coupon.percent_off) // Ensure it has a discount
      .map((coupon) => ({
        id: coupon.id,
        code: coupon.id, // Use ID as the coupon code
        percent_off: coupon.percent_off,
        expires: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : 'Forever',
      }))

    console.log('✅ Active Coupons:', activeCoupons)
    return activeCoupons
  } catch (error) {
    console.error('❌ Error Fetching Coupons:', error.message)
    return []
  }
}
// ✅ Define Zoom Course Names

// ✅ Define Service Packages and Their Booking Limits
const SERVICE_PACKAGES = {
  '3x30': 3,
  '5x30': 5,
  '8x30': 8,
}

// ✅ Map Each Zoom Link to a Custom Course Name
const zoomCourseMapping = [
  {
    name: '📘 Algebra 1 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration',
  },
  {
    name: '📗 Algebra 2 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/z2W2vvBHRQK_yEWMTteOrg#/registration',
  },
  {
    name: '📕 Calculus 1 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/kejTnKqpTpteWaMN13BAb0#/registration',
  },
  {
    name: '📙 Pre-Calculus & Trigonometry Tutoring ',
    link: 'https://us06web.zoom.us/meeting/register/jH2N2rFMSXyqX1UDEZAarQ#/registration',
  },
  {
    name: '📒 Geometry Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIVPw#/registration',
  },
]

// ✅ Specific Zoom Link for Common Core
const COMMONCORE_ZOOM_LINK = {
  name: '📚  Common Core for Parents',
  link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIIT3Sfbpyg#/registration',
}

// ✅ Define Calendly Booking Links
const CALENDLY_LINKS = {
  '3 x 30': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '5 - 30': 'https://calendly.com/rockstarmathtutoring/60min',
  '8 x 30': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
}

// ✅ Function to Generate Calendly Link with Booking Limits
const generateCalendlyLink = async (userId, sessionType) => {
  try {
    const user = await Register.findById(userId)
    if (!user) return null

    user.calendlyBookingsCount = user.calendlyBookingsCount || {} // Ensure field exists
    const currentBookings = user.calendlyBookingsCount[sessionType] || 0
    const maxBookings = SERVICE_PACKAGES[sessionType]

    // ✅ Prevent Overbooking
    if (currentBookings >= maxBookings) {
      console.warn(`⚠️ User ${userId} exceeded booking limit for ${sessionType}`)
      return null
    }

    user.calendlyBookingsCount[sessionType] = currentBookings + 1
    await user.save()

    console.log(`✅ Calendly Link Generated for ${sessionType}: ${CALENDLY_LINKS[sessionType]}`)
    return CALENDLY_LINKS[sessionType]
  } catch (error) {
    console.error('❌ Calendly Link Generation Failed:', error)
    return null
  }
}

// ✅ Function to Automatically Archive Expired Classes
const archiveExpiredCalendlySessions = async () => {
  try {
    console.log('🔄 Running Calendly auto-archiving process...')

    const users = await Register.find()
    const currentDate = new Date()

    users.forEach(async (user) => {
      const expiredSessions = user.purchasedClasses.filter(
        (cls) => cls.bookingLink && new Date(cls.purchaseDate) < currentDate,
      )

      if (expiredSessions.length > 0) {
        console.log(
          `📂 Archiving ${expiredSessions.length} expired Calendly sessions for ${user.username}`,
        )

        user.archivedClasses.push(...expiredSessions)
        user.purchasedClasses = user.purchasedClasses.filter(
          (cls) => !(cls.bookingLink && new Date(cls.purchaseDate) < currentDate),
        )

        await user.save()
      }
    })

    console.log('✅ Auto-archiving of expired Calendly sessions completed!')
  } catch (error) {
    console.error('❌ Error auto-archiving Calendly sessions:', error)
  }
}

// ✅ Schedule the function to run daily at midnight
cron.schedule('0 0 * * *', archiveExpiredCalendlySessions)

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

//     // ✅ Send Welcome Email
//     try {
//       const subject = `🎉 Welcome to Rockstar Math, ${newUser.username}!`
//       const htmlContent = `
//   <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
    
//     <div style="text-align: center; padding-bottom: 20px;">
//       <img src="https://your-logo-url.com/logo.png" alt="Rockstar Math" style="width: 150px; margin-bottom: 10px;">
//       <h2 style="color: #2C3E50;">🎉 Welcome, ${newUser.username}!</h2>
//       <p style="font-size: 16px;">We're thrilled to have you join <b>Rockstar Math</b>! 🚀</p>
//     </div>

//     <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
//       <h3 style="color: #007bff;">📢 Your Account is Ready!</h3>
//       <p>Congratulations! Your account has been successfully created. You now have access to personalized math tutoring, expert guidance, and interactive learning resources.</p>
//       <p><b>Username:</b> ${newUser.username}</p>
//       <p><b>Email:</b> ${newUser.email}</p>
//     </div>

//     <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
//       <h3 style="color: #007bff;">📌 What's Next?</h3>
//       <p>Start your learning journey today by logging into your dashboard, exploring available sessions, and scheduling your first class!</p>
//       <p><b>Access your dashboard here:</b> <a href="https://your-website.com/login" target="_blank" style="color: #007bff;">Go to Dashboard</a></p>
//     </div>

//     <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
//       <h3 style="color: #007bff;">💡 Need Help?</h3>
//       <p>Our team is always here to assist you! If you have any questions, reach out to us at <b>support@rockstarmath.com</b>.</p>
//     </div>

//     <p style="text-align: center; font-size: 16px;">Let's make math learning fun and exciting! We can't wait to see you in class. 🚀</p>

//     <div style="text-align: center; margin-top: 20px;">
//       <a href="https://calendly.com/rockstarmathtutoring" target="_blank"
//         style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
//         📅 Schedule Your First Session
//       </a>
//     </div>

//     <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">
//       Best regards,<br>
//       <b>Amy Gemme</b><br>
//       Rockstar Math Tutoring<br>
//       📞 510-410-4963
//     </p>
//   </div>
// `

//       await sendEmail(newUser.billingEmail, subject, '', htmlContent)
//       console.log('✅ Welcome email sent successfully!')
    // } catch (emailError) {
    //   console.error('❌ Error sending welcome email:', emailError)
    // }

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
    })
  } catch (error) {
    console.error('❌ Registration Error:', error)
    res.status(500).json({ success: false, error: 'Registration failed. Please try again!' })
  }
}

// 🎯 Function to Handle Purchase
exports.addPurchasedClass = async (req, res) => {
  try {
    const { userId, purchasedItems, userEmail } = req.body

    console.log('📡 Received Request in addPurchasedClass API')
    console.log('🔹 User ID:', userId)
    console.log('🔹 Purchased Items:', purchasedItems)
    console.log('🔹 User Email:', userEmail)

    console.log('🔄 Processing Purchase Request...')

    if (
      !userId ||
      !purchasedItems ||
      !Array.isArray(purchasedItems) ||
      purchasedItems.length === 0
    ) {
      return res.status(400).json({ message: 'Invalid request. Missing data.' })
    }
    const activeCoupons = await getActiveCoupons()
    let zoomLinks = []
    let couponCodes = [] // Store multiple coupons
    let commonCorePurchased = false
    let calendlyMeetingLink = null

    // ✅ Find User
    console.log(`🔎 Finding User: ${userId}`)
    const user = await Register.findById(userId)
    if (!user) {
      console.error('❌ User Not Found')
      return res.status(404).json({ message: 'User not found.' })
    }

    let newPurchases = []

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

      // ✅ Assign Coupons Based on Course Name
      let matchedCoupon = activeCoupons.find((coupon) => {
        if (item.name === 'Learn' && coupon.percent_off === 10) return true
        if (item.name === 'Achieve' && coupon.percent_off === 30) return true
        if (item.name === 'Excel' && coupon.percent_off === 20) return true
        return false
      })

      if (matchedCoupon && matchedCoupon.code) {  // ✅ Ensure valid coupon before adding
        couponCodes.push({
          code: matchedCoupon.code,
          percent_off: matchedCoupon.percent_off,
          expires: matchedCoupon.expires,
        });
      }
      
      if (['Learn', 'Achieve', 'Excel'].includes(item.name)) {
        console.log(`✅ User purchased ${item.name}, adding ALL Zoom links with names`)

        zoomCourseMapping.forEach((course) => {
          if (!zoomLinks.some((z) => z.link === course.link)) {
            zoomLinks.push(course) // ✅ Push full object with name & link
          }
        })
      }

      // ✅ Assign CommonCore Zoom Link
      if (item.name === 'CommonCore') {
        commonCorePurchased = true
      }

      newPurchases.push(newPurchase)
    }

    user.purchasedClasses.push(...newPurchases)
    user.coupons.push(...couponCodes) // Save all coupons
    await user.save()
    console.log('📡 Zoom Links Before Sending Email:', zoomLinks)
    console.log('🎟 Coupon Codes Before Sending Email:', couponCodes)

    // ✅ Add Amazon Product Link & Image

    // ✅ Send Welcome Email (Always Sent)
    console.log(`📧 Sending Welcome Email to: ${userEmail}`)
    let welcomeSubject = `🎉 Welcome to Rockstar Math, ${user.username}!`
    let welcomeHtml = `
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="https://your-logo-url.com/logo.png" alt="Rockstar Math" style="width: 150px; margin-bottom: 10px;">
        <h2 style="color: #2C3E50;">🎉 Welcome, ${user.username}!</h2>
        <p style="font-size: 16px;">We're thrilled to have you join <b>Rockstar Math</b>! 🚀</p>
      </div>
  
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">📢 Your Account is Ready!</h3>
        <p>Congratulations! Your account has been successfully created. You now have access to personalized math tutoring, expert guidance, and interactive learning resources.</p>
        <p><b>Username:</b> ${user.username}</p>
        <p><b>Email:</b> ${user.email}</p>
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
  
  <p>Check out this recommended product:</p>
  <p><a href="https://www.amazon.com/dp/B0D44R3SL5/ref=sspa_dk_detail_3?psc=1&pd_rd_i=B0D44R3SL5&pd_rd_w=K0MXw&content-id=amzn1.sym.8c2f9165-8e93-42a1-8313-73d3809141a2&pf_rd_p=8c2f9165-8e93-42a1-8313-73d3809141a2&pf_rd_r=CNH7E1SA4NWVVVB5YM4N&pd_rd_wg=9ugAn&pd_rd_r=27af69a2-618d-4241-b284-91a4973d56f2&s=electronics&sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWw" target="_blank" style="color: #007bff;">View on Amazon</a></p>
  
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
  `

    await sendEmail(userEmail, welcomeSubject, '', welcomeHtml)

    // ✅ Send Zoom & Coupon Email (Always Sent)
    console.log(`📧 Sending Zoom Links & Coupon Email to: ${userEmail}`)

    let detailsSubject = `📚 Your Rockstar Math Purchase Details`

    let detailsHtml = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #2C3E50;">🎉 Hello ${user.username}!</h2>
        <p>We're excited to have you on board! 🚀 Below are your registration details.</p>

        <h3 style="color: #007bff;">🔗 Available Courses & Registration Links:</h3>
        <ul style="list-style-type: none; padding: 0;">
    `

    // ✅ Show Proper Course Names & Their Correct Zoom Links
    if (zoomLinks.length > 0) {
      detailsHtml += `<h3>🔗 Your Course Zoom Links:</h3><ul>`

      zoomLinks.forEach((course) => {
        detailsHtml += `<li>📚 <b>${course.name}</b> – 
          <a href="${course.link}" target="_blank">Register Here</a></li>`
      })

      detailsHtml += `</ul>`
    }

    // ✅ Include CommonCore Zoom Link
    if (commonCorePurchased) {
      detailsHtml += `<li style="margin-bottom: 10px;">📚 Common Core for Parents – <a href="${COMMONCORE_ZOOM_LINK}" target="_blank" style="color: #007bff;">Register Here</a></li>`
    }

    detailsHtml += `</ul>`

    // ✅ Include Coupons (if available)
    if (couponCodes.length > 0) {
      detailsHtml += `<h3 style="color: #d9534f;">🎟 Your Exclusive Discount Coupons:</h3>`
      couponCodes.forEach((coupon) => {
        detailsHtml += `<p><b>Coupon Code:</b> ${coupon.code} - ${coupon.percent_off}% off 
      (Expires on: ${coupon.expires})</p>`
      })
    } else {
      detailsHtml += `<h3 style="color: #d9534f;">🎟 No Discount Coupons Available</h3>`
    }

    detailsHtml += `
        <h3 style="color: #5bc0de;">📌 Next Steps:</h3>
        <ol>
          <li>✅ Select one course from the list above and complete your registration.</li>
          <li>📩 Check your email for confirmation details.</li>
          <li>🖥 Log in to your Dashboard at <a href="https://rockstarmathtutoring.com" target="_blank" style="color: #007bff;">rockstarmathtutoring.com</a> to view your upcoming scheduled tutoring sessions.</li>
        </ol>

        <p style="text-align: center; font-size: 16px; font-weight: bold;">We can’t wait to see you in class! 🎉</p>
      </div>`

    // if (!ZOOM_LINKS || ZOOM_LINKS.length === 0) {
    //   console.error('❌ ZOOM_LINKS is empty or undefined!')
    // }

    await sendEmail(userEmail, detailsSubject, '', detailsHtml)
    console.log('✅ Zoom links & coupon email sent successfully!')

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

// ✅ Archive a Class
exports.archiveClass = async (req, res) => {
  try {
    const { userId, className } = req.body
    const user = await Register.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find the class to archive
    const classToArchive = user.purchasedClasses.find((c) => c.name === className)
    if (!classToArchive) {
      return res.status(404).json({ message: 'Class not found' })
    }

    // Remove from purchasedClasses and add to archivedClasses
    user.purchasedClasses = user.purchasedClasses.filter((c) => c.name !== className)
    user.archivedClasses.push(classToArchive)

    await user.save()

    res.status(200).json({ message: 'Class archived successfully!' })
  } catch (error) {
    console.error('❌ Error archiving class:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ✅ Fetch Archived Classes
exports.getArchivedClasses = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('📂 Fetching Archived Classes for User ID:', userId)

    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json({ archivedClasses: user.archivedClasses || [] })
  } catch (error) {
    console.error('❌ Error fetching archived classes:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ✅ Restore a Class
exports.restoreClass = async (req, res) => {
  try {
    const { userId, className } = req.body

    if (!userId || !className) return res.status(400).json({ message: 'Invalid request data.' })

    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const archivedClassIndex = user.archivedClasses.findIndex((c) => c.name === className)
    if (archivedClassIndex === -1)
      return res.status(404).json({ message: 'Class not found in archive.' })

    let restoredClass = user.archivedClasses[archivedClassIndex]
    if (!restoredClass.name || !restoredClass.description) {
      return res.status(400).json({ message: 'Class data is incomplete, cannot restore.' })
    }

    user.archivedClasses.splice(archivedClassIndex, 1)
    user.purchasedClasses.push({
      name: restoredClass.name,
      description: restoredClass.description,
      purchaseDate: restoredClass.purchaseDate || new Date(),
      sessionCount: restoredClass.sessionCount || 0,
      remainingSessions: restoredClass.remainingSessions || 0,
      bookingLink: restoredClass.bookingLink || null,
    })

    await user.save()

    res.status(200).json({ message: 'Class restored successfully!' })
  } catch (error) {
    console.error('❌ Error restoring class:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

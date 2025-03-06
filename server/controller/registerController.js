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
// async function getActiveCoupons() {
//   try {
//     const coupons = await stripe.coupons.list({ limit: 100 }) // Fetch latest coupons

//     let activeCoupons = coupons.data
//       .filter((coupon) => coupon.percent_off) // Ensure it has a discount
//       .map((coupon) => ({
//         id: coupon.id,
//         code: coupon.id, // Use ID as the coupon code
//         percent_off: coupon.percent_off,
//         expires: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : 'Forever',
//       }))

//     console.log('✅ Active Coupons:', activeCoupons)
//     return activeCoupons
//   } catch (error) {
//     console.error('❌ Error Fetching Coupons:', error.message)
//     return []
//   }
// }
// ✅ Define Zoom Course Names

// ✅ Define Service Packages and Their Booking Limits

// ✅ Map Each Zoom Link to a Custom Course Name
// const zoomCourseMapping = [
//   {
//     name: '📘 Algebra 1 Tutoring',
//     link: 'https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration',
//   },
//   {
//     name: '📗 Algebra 2 Tutoring',
//     link: 'https://us06web.zoom.us/meeting/register/z2W2vvBHRQK_yEWMTteOrg#/registration',
//   },
//   {
//     name: '📕 Calculus 1 Tutoring',
//     link: 'https://us06web.zoom.us/meeting/register/kejTnKqpTpteWaMN13BAb0#/registration',
//   },
//   {
//     name: '📙 Pre-Calculus & Trigonometry Tutoring ',
//     link: 'https://us06web.zoom.us/meeting/register/jH2N2rFMSXyqX1UDEZAarQ#/registration',
//   },
//   {
//     name: '📒 Geometry Tutoring',
//     link: 'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIVPw#/registration',
//   },
// ]

// ✅ Specific Zoom Link for Common Core
// const COMMONCORE_ZOOM_LINK = {
//   name: '📚  Common Core for Parents',
//   link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIIT3Sfbpyg#/registration',
// }

// ✅ Define Calendly Booking Links
const sessionMapping = {
  '3 x 30': 3,
  '5 - 30': 5,
  '8 x 30 minutes': 8,
}

const calendlyMapping = {
  '3 x 30': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '5 - 30': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '8 x 30 minutes': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
}

// ✅ Function to Generate Calendly Link with Booking Limits
// const generateCalendlyLink = async (userId, sessionType) => {
//   try {
//     const user = await Register.findById(userId)
//     if (!user) return null

//     user.calendlyBookingsCount = user.calendlyBookingsCount || {} // Ensure field exists
//     const currentBookings = user.calendlyBookingsCount[sessionType] || 0
//     const maxBookings = SERVICE_PACKAGES[sessionType]

//     // ✅ Prevent Overbooking
//     if (currentBookings >= maxBookings) {
//       console.warn(`⚠️ User ${userId} exceeded booking limit for ${sessionType}`)
//       return null
//     }

//     user.calendlyBookingsCount[sessionType] = currentBookings + 1
//     await user.save()

//     console.log(`✅ Calendly Link Generated for ${sessionType}: ${CALENDLY_LINKS[sessionType]}`)
//     return CALENDLY_LINKS[sessionType]
//   } catch (error) {
//     console.error('❌ Calendly Link Generation Failed:', error)
//     return null
//   }
// }

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
    // const activeCoupons = await getActiveCoupons()
    // let zoomLinks = []
    // let couponCodes = [] // Store multiple coupons
    // let commonCorePurchased = false
    // // let calendlyMeetingLink = null

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
      user.purchasedClasses.push(...newPurchases)
      await user.save()
    }
    // ✅ Finally, send API response
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

exports.getRemainingSession = async (req, res) => {
  try {
    const user = await Register.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // ✅ Send only relevant session data
    const sessionData = user.purchasedClasses.map((item) => ({
      name: item.name,
      remainingSessions: item.remainingSessions,
    }))

    res.json({ remainingSessions: sessionData })
  } catch (error) {
    console.error('❌ Error fetching remaining sessions:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.checkBookingLimit = async (req, res) => {
  try {
    const { userId, calendlyEventUri } = req.body

    const user = await Register.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // ✅ Find Purchased Plan
    const purchasedPlan = user.purchasedClasses.find(
      (item) => item.bookingLink === calendlyEventUri,
    )

    if (!purchasedPlan || purchasedPlan.remainingSessions <= 0) {
      return res.status(400).json({ error: 'No remaining sessions available. Upgrade your plan.' })
    }

    res
      .status(200)
      .json({ message: 'Booking Allowed', remainingSessions: purchasedPlan.remainingSessions })
  } catch (error) {
    console.error('❌ Error checking booking limit:', error)
    res.status(500).json({ error: 'Server Error' })
  }
}

exports.cancelSession = async (req, res) => {
  try {
    const { userId, startTime } = req.body

    if (!startTime) {
      return res.status(400).json({ message: 'Start time is required to find the session.' })
    }

    console.log(`🔍 Searching for session with startTime: ${startTime}`)

    // ✅ Find user
    const user = await Register.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Validate startTime before processing
    if (!startTime || isNaN(new Date(startTime).getTime())) {
      console.error('❌ Invalid startTime received:', startTime)
      return res.status(400).json({ message: 'Invalid start time format' })
    }

    const sessionIndex = user.bookedSessions.findIndex((session) => {
      const sessionStartTime = new Date(session.startTime)
      return (
        !isNaN(sessionStartTime.getTime()) &&
        sessionStartTime.toISOString() === new Date(startTime).toISOString()
      )
    })
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const canceledSession = user.bookedSessions[sessionIndex]

    console.log(`✅ Found session: ${canceledSession.eventName} at ${canceledSession.startTime}`)

    // ✅ Find the purchased plan linked to this session
    let purchasedPlan = user.purchasedClasses.find(
      (item) => item.name === canceledSession.eventName,
    )

    if (!purchasedPlan) {
      return res.status(400).json({ message: 'Purchased plan not found for this session' })
    }

    console.log(`📌 Purchased plan found: ${purchasedPlan.name}`)

    // ✅ Restore Session Count
    purchasedPlan.remainingSessions += 1

    // ✅ Move Session to Archived Classes
    user.archivedClasses.push({
      name: canceledSession.eventName,
      description: 'Session was canceled by the user',
      archivedAt: new Date(),
      sessionCount: purchasedPlan.sessionCount,
      remainingSessions: purchasedPlan.remainingSessions,
    })

    // ✅ Remove session from bookedSessions
    user.bookedSessions.splice(sessionIndex, 1)
    await user.save()

    console.log(`✅ Session canceled and archived successfully!`)

    res.status(200).json({
      message: 'Session canceled and archived successfully',
      archivedClasses: user.archivedClasses,
    })
  } catch (error) {
    console.error('❌ Error canceling session:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.rescheduleBooking = async (req, res) => {
  try {
    const { userId, eventUri, newDateTime } = req.body

    // ✅ Validate Inputs
    if (!userId || !eventUri || !newDateTime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ✅ Find User & Booking
    const user = await Register.findOne({
      _id: userId,
      'bookedSessions.calendlyEventUri': eventUri,
    })

    if (!user) {
      return res.status(404).json({ error: 'User or booking not found' })
    }

    // ✅ Find the session index
    const sessionIndex = user.bookedSessions.findIndex(
      (session) => session.calendlyEventUri === eventUri,
    )
    if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' })

    // ✅ Update Booking Time & Status
    user.bookedSessions[sessionIndex].startTime = new Date(newDateTime)
    user.bookedSessions[sessionIndex].status = 'Rescheduled' // ✅ Updating Status
    user.bookedSessions[sessionIndex].rescheduled = true
    user.bookedSessions[sessionIndex].updatedAt = new Date() // ✅ Update last modified time

    await user.save()

    // ✅ Send Email Notification to Admin
    const subject = '📢 Session Rescheduled Notification'
    const htmlContent = `
          <h3>🔄 Session Rescheduled</h3>
          <p><strong>User:</strong> ${user.billingEmail}</p>
          <p><strong>New Date/Time:</strong> ${new Date(newDateTime).toLocaleString()}</p>
          <p><strong>Event URI:</strong> ${eventUri}</p>
          <p><strong>Status:</strong> Rescheduled ✅</p>
      `

    await sendEmail('anchorwebdesigner@gmail.com', subject, '', htmlContent)

    res.status(200).json({ message: 'Session rescheduled successfully', updatedUser: user })
  } catch (error) {
    console.error('❌ Error rescheduling session:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

exports.proxyCalendly = async (req, res) => {
  try {
    const { userId, session } = req.query

    if (!userId || !session) {
      return res.status(400).send('Missing user ID or session.')
    }

    const user = await Register.findById(userId)
    if (!user) return res.status(404).send('User not found.')

    // ✅ Check if the user has purchased the specified session
    const purchasedClass = user.purchasedClasses.find((cls) => cls.name === session)

    if (!purchasedClass) {
      return res.status(403).send('You have not purchased this session.')
    }

    // ✅ Check if user has remaining sessions (prevent access if sessions are exhausted)
    if (purchasedClass.remainingSessions <= 0) {
      return res
        .status(403)
        .send(
          'Your Session Booking Limit has been reached. Please return back to www.Rockstarmath.com and log into your dashboard to view and see your scheduled sessions.',
        )
    }

    // ✅ Fetch the correct Calendly link from the static mapping
    const calendlyLink = calendlyMapping[session]

    if (!calendlyLink) {
      return res.status(400).send('Calendly link not available.')
    }

    console.log(`✅ User ${userId} is being redirected to Calendly for session: ${session}`)

    // ✅ Redirect the user to the Calendly link
    res.redirect(calendlyLink)
  } catch (error) {
    console.error('❌ Error in proxyCalendly:', error)
    res.status(500).send('Internal Server Error.')
  }
}

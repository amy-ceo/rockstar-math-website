const paypal = require('@paypal/checkout-server-sdk')
const Payment = require('../models/Payment')
const Register = require('../models/registerModel') // Ensure Register Model is imported
const sendEmail = require('../utils/emailSender')
const paypalClient = require('../config/paypal')

// ✅ Define Zoom Course Links
const zoomCourseMapping = [
  {
    name: '📘 Algebra 1 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration',
  },
  {
    name: '📗 Algebra 2 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/z2W2vvBHROGK_yEWMTeOrg#/registration',
  },
  {
    name: '📕 Calculus 1 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/kejThKqpTpetwaMNI33bAQ#/registration',
  },
  {
    name: '📙 Pre-Calculus & Trigonometry Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/jH2N2rfMSXyqX1UDEZAarQ#/registration',
  },
  {
    name: '📒 Geometry Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIYPw#/registration',
  },
]
const COMMONCORE_ZOOM_LINK = {
  name: 'Common Core- Parents',
  link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIT3Sfbpyg#/registration',
}

const sessionMapping = {
  '3 x 30 minutes': 3,
  '5 - 30 minutes': 5,
  '8 x 30 minutes': 8,
  '8 x 60 minutes': 8,
  '5 x 60 minutes': 5,
  '3 x 60 minutes': 3,
  '8 x 90 minutes': 8,
  '5 x 90 minutes': 5,
  '3 x 90 minutes': 3,
  '90 Minute Tutoring Session': 1,
  '60 Minute Tutoring Session': 1,
  '30 Minute Tutoring Session': 1,
}

const calendlyMapping = {
  '3 x 30 minutes': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '5 - 30 minutes': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '8 x 30 minutes': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
  '8 x 60 minutes': 'https://calendly.com/rockstarmathtutoring/60min',
  '5 x 60 minutes': 'https://calendly.com/rockstarmathtutoring/60min',
  '3 x 60 minutes': 'https://calendly.com/rockstarmathtutoring/60min',
  '8 x 90 minutes': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
  '5 x 90 minutes': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
  '3 x 90 minutes': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
  '90 Minute Tutoring Session': 'https://calendly.com/rockstarmathtutoring/90-minute-sessions',
  '60 Minute Tutoring Session': 'https://calendly.com/rockstarmathtutoring/60min',
  '30 Minute Tutoring Session': 'https://calendly.com/rockstarmathtutoring/30-minute-session',
}

// ✅ Fetch Active Coupons from Stripe
async function getActiveCoupons() {
  try {
    const coupons = await stripe.coupons.list({ limit: 100 })

    return coupons.data
      .filter((coupon) => coupon.percent_off) // ✅ Only coupons with discounts
      .map((coupon) => ({
        id: coupon.id,
        code: coupon.id,
        percent_off: coupon.percent_off,
        expires: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : 'Forever',
      }))
  } catch (error) {
    console.error('❌ Error Fetching Coupons:', error.message)
    return []
  }
}

// 🎯 Create PayPal Order
const calculateItemTotal = (cartItems) => {
  return cartItems
    .reduce(
      (total, item) => total + parseFloat(item.price) * (item.quantity ? item.quantity : 1),
      0,
    )
    .toFixed(2)
}

exports.createOrder = async (req, res) => {
  try {
    let { userId, amount, cartItems } = req.body

    amount = parseFloat(amount)
    if (!userId || isNaN(amount) || !cartItems || cartItems.length === 0 || amount <= 0) {
      console.error('❌ Invalid Request Data:', { userId, amount, cartItems })
      return res.status(400).json({ error: 'Invalid request data' })
    }

    // ✅ Calculate Item Total from Cart
    const calculatedItemTotal = calculateItemTotal(cartItems)
    if (parseFloat(calculatedItemTotal) !== parseFloat(amount)) {
      console.error(`❌ ITEM TOTAL MISMATCH: Expected ${amount}, Got ${calculatedItemTotal}`)
      return res
        .status(400)
        .json({ error: `ITEM TOTAL MISMATCH: Expected ${amount}, Got ${calculatedItemTotal}` })
    }

    console.log('🛒 Creating PayPal Order:', { userId, amount, cartItems })

    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: calculatedItemTotal,
            breakdown: {
              item_total: { currency_code: 'USD', value: calculatedItemTotal },
            },
          },
          description: 'E-commerce Payment',
          items: cartItems.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: parseFloat(item.price).toFixed(2),
            },
            quantity: item.quantity ? Number(item.quantity).toString() : '1',
            category: 'DIGITAL_GOODS',
          })),
        },
      ],
    })

    const order = await paypalClient.execute(request)
    if (!order.result || !order.result.id) {
      console.error('❌ PayPal Order Creation Failed - No ID Returned')
      return res.status(500).json({ error: 'PayPal order creation failed' })
    }

    res.json({ orderId: order.result.id })
  } catch (error) {
    console.error('❌ PayPal Order Error:', error.message || error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error })
  }
}

// 🎯 Capture PayPal Order & Update Purchased Classes
exports.captureOrder = async (req, res) => {
  try {
    const { orderId, user } = req.body

    if (
      !orderId ||
      !user ||
      !user._id ||
      !user.billingEmail ||
      !Array.isArray(user.cartItems) ||
      user.cartItems.length === 0
    ) {
      console.error('❌ Missing required fields:', { orderId, user })
      return res.status(400).json({ error: 'Missing required fields or empty cart items' })
    }
    const users = await Register.findById(user._id).exec() // Fetch user from DB

    console.log('🛒 Capturing PayPal Order:', orderId)
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId)
    captureRequest.requestBody({})

    let captureResponse
    try {
      captureResponse = await paypalClient.execute(captureRequest)
      console.log('✅ Capture Response:', captureResponse.result)
    } catch (captureError) {
      console.error('❌ PayPal Capture Error:', captureError)
      return res.status(400).json({ error: 'PayPal capture failed', details: captureError.message })
    }

    if (!captureResponse.result || captureResponse.result.status !== 'COMPLETED') {
      console.error('❌ PayPal Capture Failed - Status:', captureResponse.result.status)
      return res
        .status(400)
        .json({ error: 'Payment capture failed', details: captureResponse.result })
    }

    const captureDetails = captureResponse.result.purchase_units[0].payments?.captures?.[0]

    if (!captureDetails) {
      console.error('❌ Capture Details Missing:', captureResponse.result)
      return res.status(400).json({ error: 'Capture details missing from PayPal response' })
    }

    const amount = captureDetails.amount.value
    const currency = captureDetails.amount.currency_code
    const paymentIntentId = captureDetails.id // ✅ Use PayPal capture ID as `paymentIntentId`

    // ✅ Ensure `paymentIntentId` is unique before saving
    const existingPayment = await Payment.findOne({ paymentIntentId })
    if (existingPayment) {
      console.warn('⚠️ Duplicate Payment Detected, Skipping Save:', paymentIntentId)
      return res.json({ message: 'Payment already recorded.', payment: captureResponse.result })
    }

    // ✅ Save Payment Record
    try {
      console.log('🔹 Saving Payment Details...')
      const newPayment = new Payment({
        orderId,
        paymentIntentId, // ✅ Save unique payment ID
        userId: user._id,
        billingEmail: user.billingEmail,
        amount,
        currency,
        status: 'Completed',
        paymentMethod: 'PayPal',
        cartItems: user.cartItems || [],
      })

      await newPayment.save()
      console.log('✅ Payment Record Saved!')
    } catch (saveError) {
      console.error('❌ Error Saving Payment:', saveError)
      return res
        .status(500)
        .json({ error: 'Database error while saving payment.', details: saveError.message })
    }
    // ✅ Prepare recipients list (Include billingEmail & schedulingEmails)
    let recipients = [users.billingEmail]
    // ✅ If schedulingEmails is a string, add it to the list
    if (users.schedulingEmails) {
      if (Array.isArray(users.schedulingEmails)) {
        recipients = recipients.concat(users.schedulingEmails) // If it's an array, merge it
      } else {
        recipients.push(users.schedulingEmails) // If it's a string, add it directly
      }
    }

    // ✅ Remove any null or undefined values
    recipients = recipients.filter((email) => email)

    // ✅ Convert recipients array to a comma-separated string
    const recipientEmails = recipients.join(',')

    // ✅ **Step 1: Send Welcome Email (Same as Stripe)**
    console.log(`📧 Sending Welcome Email to: ${user.billingEmail}`)
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
        <p><b>Email:</b> ${user.billingEmail}</p>
      </div>

      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">📌 What's Next?</h3>
        <p>Start your learning journey today by logging into your dashboard, exploring available sessions, and scheduling your first class!</p>
        <p><b>Access your dashboard here:</b> <a href="https://www.rockstarmath.com/login" target="_blank" style="color: #007bff;">Go to Dashboard</a></p>
      </div>

      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #007bff;">💡 Need Help?</h3>
        <p>Our team is always here to assist you! If you have any questions, reach out to us at <b>rockstarmathtutoring@gmail.com</b>.</p>
      </div>

      <p style="text-align: center; font-size: 16px;">Let's make math learning fun and exciting! We can't wait to see you in class. 🚀</p>

      <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">
        Best regards,<br>
        <b>Amy Gemme</b><br>
        Rockstar Math Tutoring<br>
        📞 510-410-4963
      </p>
    </div>
    `

    await sendEmail(recipientEmails, welcomeSubject, '', welcomeHtml)

    console.log('✅ Welcome email sent successfully!')
    console.log('✅ Emails sent to:', recipientEmails)
    // ✅ Step 1: Fetch Active Coupons from Stripe
    const activeCoupons = await getActiveCoupons()
    console.log('🎟 Active Coupons from Stripe:', activeCoupons)

    // ✅ Step 2: Match Coupons Based on Purchased Course Names
    let userCoupons = activeCoupons.filter((coupon) => {
      return user.cartItems.some((item) => {
        return item.name.toLowerCase().includes(coupon.code.toLowerCase())
      })
    })

    console.log('🎟 Matched Coupons for User:', userCoupons)
    console.log(
      '🛒 Purchased Items:',
      user.cartItems.map((item) => item.name),
    )

    // ✅ Step 3: Fetch Zoom Links
    let zoomLinks = []
    if (
      ['Learn', 'Achieve', 'Excel'].some((course) =>
        user.cartItems.map((item) => item.name).includes(course),
      )
    ) {
      zoomLinks = zoomCourseMapping
    }

    // ✅ Normalize the product names for a better match
    const normalizeString = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()

    // ✅ Check if "Common Core for Parents" was purchased
    const hasCommonCore = user.cartItems.some(
      (item) => normalizeString(item.name) === normalizeString(COMMONCORE_ZOOM_LINK.name),
    )

    if (hasCommonCore) {
      zoomLinks.push(COMMONCORE_ZOOM_LINK)
    }

    // ✅ Apply Discount Coupons Based on Course Name (Ensure all relevant coupons are applied)
    let appliedCoupons = []

    user.cartItems.forEach((item) => {
      let matchedCoupons = activeCoupons.filter((coupon) => {
        if (item.name === 'Learn' && coupon.percent_off === 10) return true
        if (item.name === 'Achieve' && (coupon.percent_off === 30 || coupon.percent_off === 100))
          return true
        if (item.name === 'Excel' && coupon.percent_off === 20) return true
        return false
      })

      if (matchedCoupons.length > 0) {
        matchedCoupons.forEach((coupon) => {
          appliedCoupons.push({
            code: coupon.code,
            percent_off: coupon.percent_off,
            expires: coupon.expires,
          })
        })
      }

      // ✅ **Ensure both 30% and 100% Achieve coupons are applied**
      if (item.name === 'Achieve') {
        appliedCoupons.push(
          { code: 'fs4n9tti', percent_off: 100 }, // ✅ 100% Off Coupon
          { code: 'qRBcEmgS', percent_off: 30 }, // ✅ 30% Off Coupon
        )
      }
    })

    // ✅ Ensure duplicates are removed (if any)
    appliedCoupons = appliedCoupons.filter(
      (coupon, index, self) => index === self.findIndex((c) => c.code === coupon.code),
    )

    console.log('🎟 Final Applied Coupons:', appliedCoupons)
    if (appliedCoupons.length > 0) {
      appliedCoupons = appliedCoupons.filter((coupon) => coupon.code && coupon.code.trim() !== '')

      // ✅ Step 7: Save Coupons in User's Database
      if (appliedCoupons.length > 0) {
        await Register.findByIdAndUpdate(user._id, {
          $push: { coupons: { $each: appliedCoupons } },
        })
      }
    }

    console.log('📧 Sending Email with Zoom Links:', zoomLinks)
    console.log('🎟 Sending Email with Coupons:', appliedCoupons)

    // ✅ Extract Purchased Items & Apply Session Mapping
    const purchasedItems = user.cartItems.map((item) => {
      const formattedItemName = item.name.trim().toLowerCase() // ✅ Standardize Name for Mapping

      // ✅ Fetch Session Count & Remaining Sessions (Ensure Defaults)
      const sessionCount = sessionMapping[formattedItemName] ?? 0
      const remainingSessions = sessionMapping[formattedItemName] ?? 0

      // ✅ Fetch Calendly Booking Link (Ensure Defaults)
      const bookingLink = calendlyMapping[formattedItemName] || null

      return {
        name: item.name,
        sessionCount,
        remainingSessions,
        bookingLink,
        status: 'Active',
      }
    })
    console.log('🛒 Mapped Purchased Items with Sessions:', purchasedItems)

    // ✅ Save Purchased Classes in Database
    if (purchasedItems.length > 0) {
      await Register.findByIdAndUpdate(
        user._id,
        { $push: { purchasedClasses: { $each: purchasedItems } } },
        { new: true },
      )
    } else {
      console.log('⚠️ No new purchased classes to add.')
    }
    // ✅ **Extract Correct Calendly Booking Links for Email**
    let calendlyLinks = purchasedItems
      .filter((item) => item.bookingLink !== null) // ✅ Only Include Items with Valid Links
      .map((item) => ({
        name: item.name,
        link: item.bookingLink,
      }))

    console.log('📅 Final Calendly Links for User:', calendlyLinks)

    // ✅ **Generate Email Content & Send**
    const emailHtml = generateEmailHtml(
      user,
      zoomLinks,
      appliedCoupons,
      calendlyLinks,
      hasCommonCore,
    )

    // ✅ **Call `addPurchasedClass` API**
    try {
      console.log('📡 Calling addPurchasedClass API...')
      const purchaseResponse = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/add-purchased-class`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            purchasedItems: purchasedItems,
            userEmail: user.billingEmail,
          }),
        },
      )

      const purchaseResult = await purchaseResponse.json()
      console.log('✅ Purchased Classes API Response:', purchaseResult)

      if (!purchaseResponse.ok) {
        console.warn('⚠️ Issue updating purchased classes:', purchaseResult.message)
      }
    } catch (purchaseError) {
      console.error('❌ Error calling addPurchasedClass API:', purchaseError)
    }
    // ✅ Send Confirmation Email
    try {
      await sendEmail(
        recipientEmails,
        `🎉 Thank You for Your Purchase – Welcome to RockstarMath!`,
        ``,
        `
          <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="https://your-logo-url.com/logo.png" alt="Rockstar Math" style="width: 150px; margin-bottom: 10px;">
              <h2 style="color: #2C3E50;">🎉 Thank You for Your Purchase – Welcome to RockstarMath!</h2>
            </div>
        
            <p>Hi <b>${user.username}</b>,</p>
            
            <p>Thank you for your purchase! 🎉 We’re thrilled to have you as part of the RockstarMath community and are excited to help you achieve your math goals.</p>
        
            <h3 style="color: #007bff;">🚀 Get Started Now!</h3>
            <p>To begin, log in to your dashboard:</p>
            <p style="text-align: center;">
              <a href="https://www.rockstarmath.com/login" target="_blank" style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
            </p>
            
            <p>Use the username and password you created during registration to log in.</p>
        
            <h3 style="color: #007bff;">📌 What You Can Do in Your Dashboard:</h3>
            <ul>
              <li>🔹 <b>Update your Profile</b> to personalize your experience.</li>
              <li>📅 <b>View and manage your scheduled sessions.</b></li>
              <li>🎟 <b>Explore available coupons</b> and purchase additional classes.</li>
              <li>📚 <b>Access your classes, schedule, and archived sessions.</b></li>
            </ul>
        
            <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #2C3E50;">Home tab</h2>
              <img src="https://backend-production-cbe2.up.railway.app/image1.webp" alt="Rockstar Math" style="width: 500px; margin-bottom: 10px;">
            </div>
        <br/>
            <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #2C3E50;">My Classes</h2>
              <img src="https://backend-production-cbe2.up.railway.app/image2.webp" alt="Rockstar Math" style="width: 500px; margin-bottom: 10px;">
            </div>
        
            <br/>
            <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #2C3E50;">Schedule</h2>
              <img src="https://backend-production-cbe2.up.railway.app/image3.webp" alt="Rockstar Math" style="width: 500px; margin-bottom: 10px;">
            </div>
        
              <br/>
            <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #2C3E50;">Archive</h2>
              <img src="https://backend-production-cbe2.up.railway.app/image4.webp" alt="Rockstar Math" style="width: 500px; margin-bottom: 10px;">
            </div>
        
              <br/>
            <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #2C3E50;">Profile</h2>
              <img src="https://backend-production-cbe2.up.railway.app/image5.webp" alt="Rockstar Math" style="width: 500px; margin-bottom: 10px;">
            </div>

            <h3 style="color: #007bff;">📞 Need Assistance?</h3>
            <p>If you have any questions or need help, feel free to reach out to us:</p>
            <ul>
              <li>📧 Reply to this email</li>
              <li>📞 Call us at <b>510-410-4963</b></li>
            </ul>
        
            <p>Thank you again for choosing RockstarMath! We can’t wait to see you excel! 🚀</p>
        
            <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">
              Best regards,<br>
              <b>Amy Gemme</b><br>
              Founder, RockstarMath<br>
              📞 510-410-4963 | 🌍 <a href="https://www.rockstarmath.com" target="_blank">www.rockstarmath.com</a>
            </p>
        
          </div>
          `,
      )

      console.log('✅ Confirmation Email Sent')
    } catch (emailError) {
      console.error('❌ Email Sending Failed:', emailError)
    }
    // ✅ Send Emails (Only if schedulingEmails exist)
    await sendEmail(recipientEmails, '📚 Your Rockstar Math Purchase Details', '', emailHtml)

    console.log('✅ Purchase confirmation email sent success')

    res.json({
      message: 'Payment captured & records updated successfully.',
      payment: captureResponse.result,
      clearCart: true, // ✅ Ensure frontend knows to clear the cart
    })
  } catch (error) {
    console.error('❌ Error Capturing PayPal Payment:', error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error })
  }
}

function generateEmailHtml(user, zoomLinks, userCoupons, calendlyLinks, hasCommonCore) {
  // ✅ Calendly Proxy URL
  const proxyBaseUrl = 'https://backend-production-cbe2.up.railway.app/api/proxy-calendly'

  console.log('📧 Generating Email HTML for:', user.billingEmail)
  console.log('🎟 Coupons Included in Email:', userCoupons)

  let detailsHtml = `
          <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #2C3E50;">🎉 Hello, ${user.username}!</h2>
              <p>We're excited to have you on board! 🚀 Below are your registration details.</p>
              <h3 style="color: #007bff;">🔗 Available Courses & Registration Links:</h3>
              <ul style="list-style-type: none; padding: 0;">`

  // ✅ Add Zoom Links (if available)
  if (zoomLinks.length > 0) {
    detailsHtml += `<h3>🔗 Your Course Zoom Links:</h3><ul>`
    zoomLinks.forEach((course) => {
      detailsHtml += `<li>📚 <b>${course.name}</b> – <a href="${course.link}" target="_blank">Register Here</a></li>`
    })
    detailsHtml += `</ul>`
  }
  // ✅ Special Section for "Common Core for Parents"
  if (hasCommonCore) {
    detailsHtml += `
      <h3 style="color: #007bff;">📚 Welcome to Common Core Math for Parents!! Register below!:</h3>
      <p>
        <a href="${COMMONCORE_ZOOM_LINK.link}" target="_blank" style="display: inline-block; padding: 10px 15px; background: #007bff; color: #fff; border-radius: 5px; text-decoration: none;">
          🔗 ${COMMONCORE_ZOOM_LINK.name} – Register Here
        </a>
      </p>
    `
  }
  // ✅ Add Discount Coupons (if available)
  if (userCoupons.length > 0) {
    detailsHtml += `<h3 style="color: #d9534f;">🎟 Your Exclusive Discount Coupons:</h3>`

    userCoupons.forEach((coupon) => {
      if (coupon.percent_off === 100) {
        detailsHtml += `
          <p>
            <b>Coupon Code:</b> ${coupon.code} - <b>${coupon.percent_off}% off</b> (Expires: ${
          coupon.expires || 'undefined'
        })  
            For a Free 60-minute session valued at $100.00 Purchase here ---> 
            <a href="https://www.rockstarmath.com/services" target="_blank">https://www.rockstarmath.com/services</a>
          </p>
        `
      } else if (coupon.percent_off === 30) {
        detailsHtml += `
          <p>
            <b>Coupon Code:</b> ${coupon.code} - <b>${coupon.percent_off}% off</b> (Expires: ${
          coupon.expires || 'undefined'
        })  
            Applies to all products on the Tutoring Page Here ---> 
            <a href="https://www.rockstarmath.com/services" target="_blank">https://www.rockstarmath.com/services</a>
          </p>
        `
      }
    })
  }

  // ✅ Add Calendly Proxy Links (if available)
  if (calendlyLinks.length > 0) {
    detailsHtml += `<h3>📅 Your Scheduled Calendly Sessions:</h3>
        <p>Thank you for your purchase! Below is your registration link and important instructions on how to book your sessions</p>
        <ul>`

    calendlyLinks.forEach((session) => {
      const proxyLink = `${proxyBaseUrl}?userId=${user._id}&session=${encodeURIComponent(
        session.name,
      )}`

      // ✅ Get the session count from sessionMapping
      const sessionCount = sessionMapping[session.name.trim()] ?? 1

      detailsHtml += `<li>📚 <b>${session.name}</b> – <a href="${proxyLink}" target="_blank"><b>Book Now</b></a> (${sessionCount} sessions)</li>`
    })

    // ✅ Display dynamic session count in email
    const totalSessions = calendlyLinks.reduce(
      (sum, session) => sum + (sessionMapping[session.name.trim()] ?? 1),
      0,
    )

    detailsHtml += `</ul>
        <p>Please click the "BOOK NOW" link <b>${totalSessions}</b> times to book all of your sessions and get started.</p>
        <ul>`

    detailsHtml += `</ul>
        <p>📌Once you have booked all of your sessions, head over to your RockstarMath Dashboard where you can:</p>
        <ul>
            <li>📅 View all your scheduled sessions</li>
            <li>✏️ Reschedule sessions if needed</li>
            <li>❌ Cancel any session</li>
            <li>🛒 Purchase additional sessions</li>
        </ul>`

    detailsHtml += `</ul>
        <p>📌If you have any questions please feel free to contact us at: rockstartmathtutoring@gmail.com or (510) 410-4963</p>
      `
  }

  detailsHtml += `</div>`

  // ✅ Log Final Email Content Before Sending
  console.log('📧 Final Email Content:\n', detailsHtml)

  return detailsHtml
}

// 🎯 PayPal Webhook for Order Capture
exports.paypalWebhook = async (req, res) => {
  try {
    const event = req.body

    console.log('🔔 Received PayPal Webhook Event:', JSON.stringify(event, null, 2))

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource.id
      console.log('✅ Payment Captured via Webhook:', orderId)

      await Payment.updateOne({ orderId }, { status: 'Completed' })
    } else {
      console.warn('⚠️ Webhook received but not a capture event:', event.event_type)
    }

    res.status(200).json({ message: 'Webhook received successfully' })
  } catch (error) {
    console.error('❌ Webhook Processing Error:', error)
    res.status(500).json({ error: 'Webhook processing failed', details: error.message })
  }
}

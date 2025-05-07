const paypal = require('@paypal/checkout-server-sdk')
const Payment = require('../models/Payment')
const Register = require('../models/registerModel') // Ensure Register Model is imported
const sendEmail = require('../utils/emailSender')
const paypalClient = require('../config/paypal')
const generateOneTimeZoomLink = require('../utils/zoomLinkGenerator')

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

exports.captureOrder = async (req, res) => {
  try {
    const { orderId, user: userFromFrontend } = req.body // userFromFrontend is from localStorage

    if (
      !orderId ||
      !userFromFrontend ||
      !userFromFrontend._id ||
      !userFromFrontend.billingEmail ||
      !Array.isArray(userFromFrontend.cartItems) ||
      userFromFrontend.cartItems.length === 0
    ) {
      console.error('❌ PayPal Capture: Missing required fields:', {
        orderId,
        user: userFromFrontend,
      })
      return res.status(400).json({ error: 'Missing required fields or empty cart items' })
    }

    // Fetch the LATEST user data from DB to ensure consistency for updates
    const dbUser = await Register.findById(userFromFrontend._id).exec()
    if (!dbUser) {
      console.error(`❌ PayPal Capture: User not found in DB for ID: ${userFromFrontend._id}`)
      return res.status(404).json({ error: 'User not found in database.' })
    }

    console.log('🛒 Capturing PayPal Order:', orderId)
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId)
    captureRequest.requestBody({})

    let captureResponse
    try {
      captureResponse = await paypalClient.execute(captureRequest)
      console.log('✅ PayPal Capture Response:', JSON.stringify(captureResponse.result, null, 2))
    } catch (captureError) {
      console.error('❌ PayPal API Capture Error:', captureError.message || captureError)
      // Check for specific PayPal error like ORDER_ALREADY_CAPTURED
      if (captureError.isAxiosError && captureError.response && captureError.response.data) {
        const payPalErrorDetails = captureError.response.data.details
        if (
          payPalErrorDetails &&
          payPalErrorDetails.some((d) => d.issue === 'ORDER_ALREADY_CAPTURED')
        ) {
          console.warn(`⚠️ PayPal Order ${orderId} already captured.`)
          // Attempt to find existing payment and respond as if successful to avoid user confusion
          const existingPaymentByOrderId = await Payment.findOne({ orderId: orderId }) // Or StripePayment
          if (existingPaymentByOrderId) {
            console.log(`Found existing payment for already captured order ${orderId}.`)
            return res.json({
              message: 'Payment was already captured and recorded.',
              paymentId: existingPaymentByOrderId.paymentIntentId, // PayPal Capture ID
              redirectTo: '/dashboard',
            })
          }
        }
      }
      return res
        .status(400)
        .json({ error: 'PayPal capture failed at API level', details: captureError.message })
    }

    if (!captureResponse.result || captureResponse.result.status !== 'COMPLETED') {
      console.error(
        '❌ PayPal Capture Not Completed - Status:',
        captureResponse.result.status,
        captureResponse.result,
      )
      return res.status(400).json({
        error: 'Payment capture was not completed by PayPal',
        details: captureResponse.result,
      })
    }

    const captureDetails = captureResponse.result.purchase_units[0]?.payments?.captures?.[0]
    if (!captureDetails || !captureDetails.id) {
      console.error(
        '❌ PayPal Capture Details Missing or Capture ID missing:',
        captureResponse.result,
      )
      return res
        .status(400)
        .json({ error: 'Essential capture details missing from PayPal response' })
    }

    const paypalCaptureId = captureDetails.id // This is PayPal's unique ID for the capture

    const paymentModelToUse = Payment // Or StripePayment if consolidating
    const existingPayment = await paymentModelToUse.findOne({ paymentIntentId: paypalCaptureId })

    if (existingPayment) {
      console.warn(
        `⚠️ Duplicate PayPal Capture ID Detected: ${paypalCaptureId}. Payment already recorded.`,
      )
      return res.json({
        message: 'Payment already recorded (duplicate capture ID).',
        paymentId: paypalCaptureId,
        redirectTo: '/dashboard',
      })
    }

    let newPaymentRecord
    try {
      console.log('🔹 Saving PayPal Payment Details to DB...')
      newPaymentRecord = new Payment({
        // Using your 'Payment' model for PayPal
        orderId: orderId, // PayPal Order ID from createOrder
        paymentIntentId: paypalCaptureId, // PayPal Capture ID (this should be unique)
        userId: dbUser._id,
        billingEmail: dbUser.billingEmail, // From dbUser for accuracy
        amount: parseFloat(captureDetails.amount.value),
        currency: captureDetails.amount.currency_code,
        status: 'Completed', // Or 'succeeded'
        paymentMethod: 'PayPal',
        cartItems:
          userFromFrontend.cartItems.map((item) => ({
            // Use cartItems from this specific transaction
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })) || [],
        createdAt: new Date(captureDetails.create_time || Date.now()), // PayPal's timestamp
      })

      await newPaymentRecord.save()
      console.log(
        `✅ PayPal Payment Record Saved! DB ID: ${newPaymentRecord._id}, Capture ID: ${paypalCaptureId}`,
      )
    } catch (saveError) {
      console.error('❌ Error Saving PayPal Payment to DB:', saveError)
      // This is a critical error; if DB save fails, the system is out of sync.
      return res
        .status(500)
        .json({ error: 'Database error while saving payment.', details: saveError.message })
    }

    // --- SOCKET.IO EMISSION ---
    const io = req.io
    if (io) {
      // Format for consistency with admin payments page if possible
      const paymentDataForSocket = {
        id: newPaymentRecord.paymentIntentId, // Or newPaymentRecord._id (DB id)
        paymentIntentId: newPaymentRecord.paymentIntentId,
        userId: dbUser
          ? { _id: dbUser._id, username: dbUser.username, billingEmail: dbUser.billingEmail }
          : null,
        billingEmail: newPaymentRecord.billingEmail,
        amount: newPaymentRecord.amount,
        currency: newPaymentRecord.currency,
        status: newPaymentRecord.status,
        paymentMethod: newPaymentRecord.paymentMethod,
        cartItems: newPaymentRecord.cartItems,
        createdAt: newPaymentRecord.createdAt,
        // Add any other fields your admin payments table expects
      }
      io.emit('newPaymentProcessed', paymentDataForSocket)
      console.log(
        '📊 Emitted newPaymentProcessed for PayPal via WebSocket:',
        paymentDataForSocket.id,
      )

      // Also update summary stats
      // Ensure this query considers ALL payment types if you have multiple models/methods
      const allPaymentRecords = await paymentModelToUse.find({
        status: { $in: ['Completed', 'succeeded'] },
      })
      const totalRevenue = allPaymentRecords.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalTransactionDocs = await paymentModelToUse.countDocuments()
      const problemTransactionDocs = await paymentModelToUse.countDocuments({
        status: { $in: ['failed', 'pending', 'requires_payment_method', 'canceled', 'refunded'] },
      })

      io.emit('paymentSummaryUpdated', {
        totalRevenue,
        totalTransactions: totalTransactionDocs,
        failedTransactions: problemTransactionDocs, // or problemTransactions
      })
      console.log('📊 Emitted paymentSummaryUpdated for PayPal via WebSocket')
    }
    // --- END SOCKET.IO EMISSION ---

    // --- Post-Purchase User Updates & Emails (using dbUser) ---
    let recipients = [dbUser.billingEmail]
    if (dbUser.schedulingEmails) {
      recipients = recipients.concat(
        Array.isArray(dbUser.schedulingEmails)
          ? dbUser.schedulingEmails
          : [dbUser.schedulingEmails],
      )
    }
    recipients = recipients.filter(Boolean) // Remove null/undefined
    const recipientEmailsString = recipients.join(',')

    // Send Welcome Email
    console.log(`📧 Sending Welcome Email to: ${dbUser.billingEmail}`)
    let welcomeSubject = `🎉 Welcome to RockstarMath, ${dbUser.username}!`
    // ... (your welcomeHtml, ensure variables like dbUser.username are used)
    let welcomeHtml = `
       <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
         <div style="text-align: center; padding-bottom: 20px;">
           <img src="https://www.rockstarmath.com/images/logo.png" alt="RockstarMath" style="width: 150px; margin-bottom: 10px;">
         <h2 style="color: #2C3E50;">🎉 Welcome, ${dbUser.username}!</h2>
         <p style="font-size: 16px;">We're thrilled to have you join <b>RockstarMath</b>! 🚀</p>
       </div>
       <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
         <h3 style="color: #007bff;">📢 Your Account is Ready!</h3>
         <p>Congratulations! Your account has been successfully created...</p>
         <p><b>Username:</b> ${dbUser.username}</p><p><b>Email:</b> ${dbUser.billingEmail}</p>
       </div>
       <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;"><h3 style="color: #007bff;">📌 What's Next?</h3><p>... <a href="https://www.rockstarmath.com/login" target="_blank" style="color: #007bff;">Go to Dashboard</a></p></div>
       <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;"><h3 style="color: #007bff;">💡 Need Help?</h3><p>... rockstarmathtutoring@gmail.com ...</p></div>
       <p style="text-align: center; font-size: 16px;">Let's make math learning fun and exciting! ... 🚀</p>
       <p style="text-align: center; font-size: 14px; color: #555; margin-top: 20px;">Best regards,<br><b>Amy Gemme</b><br>RockstarMath Tutoring<br>📞 510-410-4963</p>
     </div>`
    await sendEmail(recipientEmailsString, welcomeSubject, '', welcomeHtml)
    console.log('✅ Welcome email sent!')

    // Manage Coupons, Purchased Classes, etc. for dbUser
    const activeCoupons = await getActiveCoupons()
    let appliedCouponsToSave = [] // Renamed to avoid conflict

    ;(userFromFrontend.cartItems || []).forEach((item) => {
      if (item.name.toLowerCase() === 'achieve') {
        appliedCouponsToSave.push({ code: 'fs4n9tti', percent_off: 100, expires: 'Forever' })
        appliedCouponsToSave.push({ code: 'qRBcEmgS', percent_off: 30, expires: 'Forever' })
      }
      // Add other coupon logic...
    })
    appliedCouponsToSave = appliedCouponsToSave.filter(
      (c, i, self) =>
        i === self.findIndex((t) => t.code === c.code && t.percent_off === c.percent_off),
    )

    if (appliedCouponsToSave.length > 0) {
      const newCouponsForDB = appliedCouponsToSave.filter(
        (ac) => !(dbUser.coupons || []).some((dbc) => dbc.code === ac.code),
      )
      if (newCouponsForDB.length > 0) {
        dbUser.coupons.push(...newCouponsForDB)
      }
    }

    const proxyCalendlyBaseUrl = `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 5000
    }/api/proxy-calendly`
    const purchasedItemsForDB = (userFromFrontend.cartItems || []).map((item) => {
      const originalCalendlyLink = calendlyMapping[item.name.trim().toLowerCase()] || null
      return {
        name: item.name,
        sessionCount: sessionMapping[item.name.trim().toLowerCase()] || 0,
        remainingSessions: sessionMapping[item.name.trim().toLowerCase()] || 0,
        bookingLink: originalCalendlyLink,
        proxyBookingLink: originalCalendlyLink
          ? `${proxyCalendlyBaseUrl}?userId=${dbUser._id}&session=${encodeURIComponent(item.name)}`
          : null,
        status: 'Active',
      }
    })

    if (purchasedItemsForDB.length > 0) {
      const newPurchasedClasses = purchasedItemsForDB.filter(
        (pi) => !(dbUser.purchasedClasses || []).some((pc) => pc.name === pi.name), // Simple check, might need more complex for re-purchase
      )
      if (newPurchasedClasses.length > 0) {
        dbUser.purchasedClasses.push(...newPurchasedClasses)
      }
    }
    await dbUser.save({ validateBeforeSave: false }) // Save all accumulated changes to dbUser
    console.log('✅ User coupons and purchased classes updated in DB.')

    // Determine Zoom and Calendly links for the confirmation email
    let emailZoomLinks = []
    if (
      ['Learn', 'Achieve', 'Excel'].some((course) =>
        (userFromFrontend.cartItems || []).map((item) => item.name).includes(course),
      )
    ) {
      emailZoomLinks = zoomCourseMapping
    }
    const hasCommonCore = (userFromFrontend.cartItems || []).some(
      (item) => item.name.trim().toLowerCase() === COMMONCORE_ZOOM_LINK.name.toLowerCase(),
    )
    if (hasCommonCore) emailZoomLinks.push(COMMONCORE_ZOOM_LINK)

    let emailCalendlyLinks = purchasedItemsForDB
      .filter((item) => item.proxyBookingLink) // Use proxyBookingLink for the email
      .map((item) => ({ name: item.name, link: item.proxyBookingLink }))

    // Generate and Send Purchase Confirmation Email
    const purchaseEmailHtml = generateEmailHtml(
      dbUser, // Use the updated dbUser for email personalization
      emailZoomLinks,
      appliedCouponsToSave, // Send the coupons that were determined for this transaction
      emailCalendlyLinks,
      hasCommonCore,
    )
    await sendEmail(
      recipientEmailsString,
      '📚 Your RockstarMath Purchase Details',
      '',
      purchaseEmailHtml,
    )
    console.log('✅ Purchase confirmation email sent.')

    // The call to /api/add-purchased-class (your internal API)
    // This seems redundant if you're already updating `dbUser.purchasedClasses` directly above.
    // If it does something DIFFERENT, keep it. Otherwise, it might be removed to avoid double processing.
    // For now, keeping your existing call:
    try {
      console.log('📡 Calling internal /api/add-purchased-class (review if redundant)...')
      await fetch(
        `${
          process.env.API_BASE_URL || 'https://backend-production-cbe2.up.railway.app'
        }/api/add-purchased-class`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: dbUser._id,
            purchasedItems: purchasedItemsForDB, // Send the mapped items
            userEmail: dbUser.billingEmail,
          }),
        },
      )
      // const purchaseResult = await purchaseResponse.json(); // process if needed
    } catch (internalApiError) {
      console.error('❌ Error calling internal /api/add-purchased-class:', internalApiError)
    }

    // --- Final Response to Frontend ---
    res.json({
      message: 'Payment captured, processed, and user updated successfully!',
      paymentId: paypalCaptureId,
      redirectTo: '/dashboard', // This is what the frontend will use
    })
  } catch (error) {
    console.error('❌ Outer Catch: Error Capturing PayPal Payment:', error)
    res.status(500).json({
      error: 'Internal Server Error during PayPal capture.',
      details: error.message || error,
    })
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

  const proxyZoomBaseUrl = 'https://backend-production-cbe2.up.railway.app/api/proxy-zoom'

  if (zoomLinks.length > 0) {
    detailsHtml += `<h3>🔗 Your Course Zoom Links:</h3><ul>`

    zoomLinks.forEach((course) => {
      // ✅ Generate Proxy Zoom URL
      const proxyLink = `${proxyZoomBaseUrl}?userId=${user._id}&session=${encodeURIComponent(
        course.name,
      )}`

      detailsHtml += `<li>📚 <b>${course.name}</b> – 
         <a href="${proxyLink}" target="_blank"><b>Register Here</b></a> (One-time Access)
       </li>`
    })

    detailsHtml += `</ul>`
  }
  // ✅ Add Common Core Proxy URL if Purchased
  if (hasCommonCore) {
    const commonCoreProxyLink = `${proxyZoomBaseUrl}?userId=${
      user._id
    }&session=${encodeURIComponent(COMMONCORE_ZOOM_LINK.name)}`

    detailsHtml += `
      <h3 style="color: #007bff;">📚 Welcome to Common Core Math for Parents!! Register below:</h3>
      <p>
        <a href="${commonCoreProxyLink}" target="_blank" style="display: inline-block; padding: 10px 15px; background: #007bff; color: #fff; border-radius: 5px; text-decoration: none;">
          🔗 ${COMMONCORE_ZOOM_LINK.name} – Register Here (One-time Access)
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

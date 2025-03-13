const express = require('express')
const router = express.Router()
const sendEmail = require('../utils/emailSender')
const Payment = require('../models/Payment')
require('dotenv').config() // Ensure environment variables are loaded
const bodyParser = require('body-parser') // Ensure body-parser is imported
const Register = require('../models/registerModel') // ✅ Using Register Model
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const StripePayment = require('../models/StripePayment') // ✅ Import the new model

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
  name: '📚  Common Core for Parents',
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

// ✅ Test routes for products/prices (unchanged)
router.get('/test-products', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 100 })
    res.json(products.data)
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/test-prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({ limit: 100 })
    res.json(prices.data)
  } catch (error) {
    console.error('❌ Error fetching prices:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/get-plans', async (req, res) => {
  try {
    let allProducts = []
    let hasMore = true
    let lastProductId = null
    while (hasMore) {
      const params = {
        active: true,
        limit: 10,
        expand: ['data.default_price'],
      }
      if (lastProductId) params.starting_after = lastProductId
      const products = await stripe.products.list(params)
      allProducts = [...allProducts, ...products.data]
      hasMore = products.has_more
      if (products.data.length > 0) {
        lastProductId = products.data[products.data.length - 1].id
      }
    }
    const allowedNames = ['learn', 'achieve', 'excel', 'common core- parents']
    const filteredProducts = allProducts.filter((product) =>
      allowedNames.includes(product.name.trim().toLowerCase()),
    )
    if (filteredProducts.length === 0) {
      return res.status(404).json({ message: 'No matching subscription plans found' })
    }
    const formattedProducts = filteredProducts.map((product) => {
      let priceAmount = 'N/A'
      let currency = 'USD'
      if (product.default_price && product.default_price.unit_amount) {
        priceAmount = (product.default_price.unit_amount / 100).toFixed(2)
        currency = product.default_price.currency.toUpperCase()
      }
      return {
        id: product.id,
        name: product.name,
        description: product.description || 'No description available',
        images: product.images.length > 0 ? product.images[0] : '/default-image.png',
        price: priceAmount,
        currency: currency,
      }
    })
    res.json(formattedProducts)
  } catch (error) {
    console.error('Error fetching plans:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

router.get('/get-products', async (req, res) => {
  try {
    let allProducts = []
    let hasMore = true
    let lastProductId = null
    const excludedProducts = ['Learn', 'Achieve', 'Excel']
    while (hasMore) {
      const params = {
        active: true,
        limit: 100,
        expand: ['data.default_price'],
      }
      if (lastProductId) params.starting_after = lastProductId
      const response = await stripe.products.list(params)
      const filteredProducts = response.data.filter(
        (product) => !excludedProducts.includes(product.name),
      )
      allProducts = [...allProducts, ...filteredProducts]
      hasMore = response.has_more
      if (response.data.length > 0) {
        lastProductId = response.data[response.data.length - 1].id
      }
    }
    if (allProducts.length === 0) {
      return res.status(404).json({ message: 'No products found in Stripe.' })
    }
    const formattedProducts = allProducts.map((product) => {
      let priceAmount = 'Price Not Available'
      let currency = 'USD'
      if (product.default_price && product.default_price.unit_amount) {
        priceAmount = (product.default_price.unit_amount / 100).toFixed(2)
        currency = product.default_price.currency.toUpperCase()
      }
      return {
        id: product.id,
        name: product.name,
        description: product.description || 'No description available',
        images: product.images.length > 0 ? product.images[0] : '/default-placeholder.png',
        price: priceAmount,
        currency: currency,
      }
    })
    console.log('✅ Products with Prices:', formattedProducts)
    res.json(formattedProducts)
  } catch (error) {
    console.error('❌ Stripe API Error:', error)
    res.status(500).json({ error: 'Failed to fetch products. Please try again later.' })
  }
})

router.post('/create-payment-intent', async (req, res) => {
  try {
    let { amount, currency, userId, orderId, cartItems, userEmail } = req.body;
    // Add checks if any required field is missing
    if (!amount || !currency || !userId || !orderId || !cartItems) {
      console.error('❌ Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!userId || !orderId || !cartItems || cartItems.length === 0) {
      console.error('❌ Missing required fields:', { userId, orderId, cartItems })
      return res.status(400).json({ error: 'Missing required fields: userId, orderId, cartItems.' })
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount received:', amount)
      return res.status(400).json({ error: 'Invalid amount. Must be greater than 0.' })
    }
    amount = Math.round(amount * 100) // Convert to cents
    const supportedCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud']
    if (!currency || !supportedCurrencies.includes(currency.toLowerCase())) {
      console.error('❌ Unsupported currency:', currency)
      return res.status(400).json({ error: 'Unsupported currency. Use USD, EUR, GBP, etc.' })
    }
    // ✅ Optimize metadata
    const metadata = {
      userId: String(userId),
      orderId: String(orderId),
      userEmail: userEmail || 'no-email@example.com',
      cartSummary: cartItems.map((item) => item.name).join(', '),
      cartItemIds: JSON.stringify(cartItems.map((item) => item.id)),
      bookingLinks: JSON.stringify(cartItems.map((item) => calendlyMapping[item.name] || null)),
    }
    console.log('📡 Sending Payment Intent with Metadata:', metadata)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata,
    })
    if (!paymentIntent.client_secret) {
      console.error('❌ Missing client_secret in response:', paymentIntent)
      return res
        .status(500)
        .json({ error: 'Payment Intent creation failed. No client_secret returned.' })
    }
    console.log(`✅ PaymentIntent Created: ${paymentIntent.id} for User: ${userId}`)
    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id })
  } catch (error) {
    console.error('❌ Stripe Payment Intent Error:', error)
    res.status(500).json({ error: 'Payment creation failed. Please try again later.' })
  }
})

router.post('/capture-stripe-payment', async (req, res) => {
  try {
    const { paymentIntentId, user } = req.body
    console.log('📡 Received Stripe Payment Capture Request:', { paymentIntentId, user })

    if (!user || !user._id || !Array.isArray(user.cartItems) || user.cartItems.length === 0) {
      console.error('❌ Missing required fields in Stripe Capture:', { paymentIntentId, user })
      return res.status(400).json({ error: 'Missing required fields or empty cart items' })
    }

    console.log('📡 Capturing Stripe Payment:', paymentIntentId)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      console.error('❌ Payment Intent Failed or Incomplete:', paymentIntent.status)
      return res.status(400).json({ error: 'Payment not completed' })
    }

    console.log('✅ Stripe Payment Successful:', paymentIntentId)

    // ✅ Step 1: Save Payment in Database
    try {
      console.log('🔹 Saving Payment Record to DB...')
      const newPayment = new Payment({
        orderId: `stripe_${Date.now()}`,
        paymentIntentId,
        userId: user._id,
        billingEmail: user.billingEmail || 'No email',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'Completed',
        paymentMethod: 'Stripe',
        cartItems: user.cartItems || [],
      })

      await newPayment.save()
      console.log('✅ Payment Record Saved in Database!')
    } catch (saveError) {
      console.error('❌ Error Saving Payment:', saveError)
      return res.status(500).json({ error: 'Database error while saving payment.' })
    }

    // ✅ Step 2: Call addPurchasedClass API
    try {
      console.log('📡 Calling addPurchasedClass API with Data:', {
        userId: user._id,
        purchasedItems: user.cartItems.map((item) => ({
          name: item.name,
          description: item.description || 'No description available',
        })),
        userEmail: user.billingEmail || 'No email',
      })

      const purchaseResponse = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/add-purchased-class',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            purchasedItems: user.cartItems.map((item) => ({
              name: item.name,
              description: item.description || 'No description available',
            })),
            userEmail: user.billingEmail || 'No email',
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

    // ✅ Step 3: Send Clear Cart Signal to Frontend
    res.json({
      message: 'Payment captured & records updated successfully.',
      clearCart: true, // 🔹 Explicitly tell frontend to clear the cart
    })
  } catch (error) {
    console.error('❌ Error Capturing Stripe Payment:', error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error })
  }
})

router.get('/payment-details/:paymentIntentId', async (req, res) => {
  try {
    const paymentIntentId = req.params.paymentIntentId
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return res.status(400).json({ error: 'Invalid Payment Intent ID.' })
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    console.log(`✅ Payment Retrieved: ID=${paymentIntent.id}, Status=${paymentIntent.status}`)
    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method_types[0] || 'unknown',
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    })
  } catch (error) {
    console.error('❌ Stripe API Error:', error.message)
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid Payment Intent ID.' })
    }
    res.status(500).json({ error: 'Failed to retrieve payment details. Try again later.' })
  }
})

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, cartItems } = req.body
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Invalid request, missing userId or cartItems.' })
    }
    console.log('🔹 Creating Checkout Session for User:', userId)
    console.log('🛒 Cart Items:', cartItems)
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: item.currency || 'usd',
        product_data: { name: item.name || 'Unnamed Product' },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }))
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://www.rockstarmath.com/payment-success',
      cancel_url: 'https://www.rockstarmath.com/payment-cancel',
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planName: cartItems.length > 0 ? cartItems[0].name : 'Unknown Plan',
      },
    })
    console.log('✅ Checkout Session Created:', session.id)
    res.json({ sessionId: session.id })
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    res.status(500).json({ error: 'Error creating checkout session' })
  }
})

// ✅ Webhook for Stripe Payments
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  let event
  const sig = req.headers['stripe-signature']
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('❌ Webhook Signature Verification Failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  console.log('🔔 Received Stripe Webhook Event:', event.type)
  if (event.type === 'payment_intent.succeeded') {
    console.log('✅ Payment Intent Succeeded Event Triggered')
    const paymentIntent = event.data.object
    // ✅ Extract User & Cart Data
    const userId = paymentIntent.metadata?.userId
    const cartSummary = paymentIntent.metadata?.cartSummary?.split(', ') || []
    const userEmail = paymentIntent.metadata?.userEmail || 'No email provided'
    console.log('🔹 User ID:', userId)
    console.log('🛒 Purchased Items:', cartSummary)
    if (!userId || cartSummary.length === 0) {
      console.warn('⚠️ Missing user ID or cart summary. Skipping update.')
      return res.status(400).json({ error: 'Invalid payment data' })
    }

    try {
      // ✅ Fetch user first to check for existing purchases
      const user = await Register.findById(userId).catch(error => {
        console.error('❌ Database Error:', error)
        throw new Error('Failed to fetch user')
      })
      if (!user) {
        console.error('❌ Error: User not found in database!')
        return res.status(404).json({ error: 'User not found' })
      }
      
      const users = await Register.findById(user._id).exec() // Fetch user from DB
      // ✅ Save Payment Record in `StripePayment` Model
      const newStripePayment = new StripePayment({
        orderId: `stripe_${Date.now()}`,
        paymentIntentId: paymentIntent.id,
        userId: user._id,
        billingEmail: userEmail,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'Completed',
        paymentMethod: 'Stripe',
        cartItems: cartSummary.map((item) => ({ name: item })),
      })

      await newStripePayment.save()
      console.log('✅ Stripe Payment Saved in Database!')
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

      // ✅ Clear Cart in Database (Assuming user has a `cart` field in `Register` Model)
      const updatedUser = await Register.findByIdAndUpdate(
        userId,
        { $set: { cart: [] } },
        { new: true },
      )
      console.log('🔍 Cart After Clearing:', updatedUser.cart)

      // ✅ **Send Welcome Email**
      console.log(`📧 Sending Welcome Email to: ${userEmail}`)
      let welcomeSubject = `🎉 Welcome to Rockstar Math, ${user.username}!`
      let welcomeHtml = `
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
      `
      await sendEmail(recipientEmails, welcomeSubject, '', welcomeHtml)
      console.log('✅ Welcome email sent successfully!')
      console.log('✅ Emails sent to:', recipientEmails)
      // ✅ Track existing purchased classes to prevent duplicates
      const existingClasses = new Set(
        user.purchasedClasses.map((cls) => cls.name.toLowerCase().trim()),
      )
      // ✅ Filter new purchases to avoid duplicate entries
      const purchasedItems = cartSummary
        .filter((item) => !existingClasses.has(item.toLowerCase().trim()))
        .map((item) => ({
          name: item,
          sessionCount: sessionMapping[item] || 0,
          remainingSessions: sessionMapping[item] || 0,
          bookingLink: calendlyMapping[item] || null,
          status: 'Active',
        }))
      if (purchasedItems.length > 0) {
        await Register.findByIdAndUpdate(
          userId,
          {
            $push: { purchasedClasses: { $each: purchasedItems } },
          },
          { new: true },
        )
      } else {
        console.log('⚠️ No new purchased classes to add.')
      }
      // ✅ Continue with Zoom links, Calendly, Coupons, and Emails
      const activeCoupons = await getActiveCoupons()
      console.log('🎟 Active Coupons from Stripe:', activeCoupons)
      let userCoupons = activeCoupons.filter((coupon) => {
        return cartSummary.some((item) => {
          return item.toLowerCase().includes(coupon.code.toLowerCase())
        })
      })
      console.log('🛒 Purchased Items from Metadata:', cartSummary)
      let zoomLinks = []
      if (['Learn', 'Achieve', 'Excel'].some((course) => cartSummary.includes(course))) {
        zoomLinks = zoomCourseMapping
      }

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
      // ✅ Check if "Common Core for Parents" was purchased
      const hasCommonCore = user.cartItems.some(
        (item) => normalizeString(item.name) === normalizeString(COMMONCORE_ZOOM_LINK.name),
      )

      if (hasCommonCore) {
        zoomLinks.push(COMMONCORE_ZOOM_LINK)
      }

      let calendlyLinks = []
      cartSummary.forEach((item) => {
        const formattedItemName = item.trim().toLowerCase()
        Object.keys(calendlyMapping).forEach((calendlyKey) => {
          if (formattedItemName === calendlyKey.toLowerCase().trim()) {
            calendlyLinks.push({
              name: item,
              link: calendlyMapping[calendlyKey],
            })
          }
        })
      })
      let appliedCoupons = []
      cartSummary.forEach((item) => {
        let matchedCoupon = activeCoupons.find((coupon) => {
          if (item === 'Learn' && coupon.percent_off === 10) return true
          if (item === 'Achieve' && coupon.percent_off === 30) return true
          if (item === 'Excel' && coupon.percent_off === 20) return true
          return false
        })
        if (matchedCoupon && matchedCoupon.code) {
          appliedCoupons.push({
            code: matchedCoupon.code,
            percent_off: matchedCoupon.percent_off,
            expires: matchedCoupon.expires,
          })
        }
      })
      if (appliedCoupons.length > 0) {
        appliedCoupons = appliedCoupons.filter((coupon) => coupon.code && coupon.code.trim() !== '')
        if (appliedCoupons.length > 0) {
          await Register.findByIdAndUpdate(userId, {
            $push: { coupons: { $each: appliedCoupons } },
          })
        }
      }
      if (calendlyLinks.length > 0) {
        await Register.findByIdAndUpdate(userId, {
          $push: { calendlyBookings: { $each: calendlyLinks } },
        })
      }
      console.log('🛒 Purchased Items from Metadata:', cartSummary)
      console.log('📅 Available Calendly Links:', Object.keys(calendlyMapping))
      console.log('📧 Sending Email with Zoom Links & Calendly Links:', zoomLinks, calendlyLinks)
      console.log('🎟 Sending Email with Coupons:', appliedCoupons)
      const emailHtml = generateEmailHtml(
        user,
        zoomLinks,
        userCoupons,
        calendlyLinks,
        hasCommonCore,
      )
      await sendEmail(recipientEmails, '📚 Your Rockstar Math Purchase Details', '', emailHtml)
      console.log('✅ Purchase confirmation email sent successfully!')
      return res.status(200).json({ message: 'Purchase updated & all emails sent!' })
    } catch (error) {
      console.error('❌ Error processing purchase:', error)
      return res.status(500).json({ error: 'Error updating purchased classes' })
    }
  }
  res.sendStatus(200)
})

// ✅ Function to Generate Email HTML
function generateEmailHtml(user, zoomLinks, userCoupons, calendlyLinks, hasCommonCore) {
  // Use proxy link for Calendly bookings instead of direct links
  const proxyBaseUrl = 'https://backend-production-cbe2.up.railway.app/api/proxy-calendly'
  let detailsHtml = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2C3E50;">🎉 Hello ${user.username}!</h2>
          <p>We're excited to have you on board! 🚀 Below are your registration details.</p>
          <h3 style="color: #007bff;">🔗 Available Courses & Registration Links:</h3>
          <ul style="list-style-type: none; padding: 0;">`
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
  if (userCoupons.length > 0) {
    detailsHtml += `<h3 style="color: #d9534f;">🎟 Your Exclusive Discount Coupons:</h3>`
    userCoupons.forEach((coupon) => {
      detailsHtml += `<p><b>Coupon Code:</b> ${coupon.code} - ${coupon.percent_off}% off (Expires: ${coupon.expires})</p>`
    })
  }
  if (calendlyLinks.length > 0) {
    // ✅ Add structured heading
    detailsHtml += `<h3>📅 Your Scheduled Calendly Sessions:</h3>
    <p>Thank you for purchasing! Below is your registration link and important instructions on how to book your sessions:</p>
    
    <ul>`

    calendlyLinks.forEach((session) => {
      // ✅ Create the proxy link with user ID and session name parameters
      const proxyLink = `${proxyBaseUrl}?userId=${user._id}&session=${encodeURIComponent(
        session.name,
      )}`
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
      </ul>
`
    detailsHtml += `</ul>
<p>📌If you have any questions please feel free to contact us at: rockstartmathtutoring@gmail.com or (510) 410-4963</p>
`
  }

  detailsHtml += `</div>`
  return detailsHtml
}

module.exports = router

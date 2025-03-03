const express = require('express')
const router = express.Router()
const sendEmail = require('../utils/emailSender')
const Payment = require('../models/Payment')
require('dotenv').config() // Ensure environment variables are loaded
// const { updatePaymentStatus } = require("../controller/paymentController");
const bodyParser = require('body-parser') // Ensure body-parser is imported
const Register = require('../models/registerModel') // ✅ Using Register Model
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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
    link: 'https://us06web.zoom.us/meeting/register/z2W2vvBHRQK_yEWMTteOrg#/registration',
  },
  {
    name: '📕 Calculus 1 Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/kejTnKqpTpteWaMN13BAb0#/registration',
  },
  {
    name: '📙 Pre-Calculus & Trigonometry Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/jH2N2rFMSXyqX1UDEZAarQ#/registration',
  },
  {
    name: '📒 Geometry Tutoring',
    link: 'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIVPw#/registration',
  },
]
const COMMONCORE_ZOOM_LINK = {
  name: '📚  Common Core for Parents',
  link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIIT3Sfbpyg#/registration',
}

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

// ✅ Fetch all products from Stripe
router.get('/test-products', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 100 })
    res.json(products.data)
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    res.status(500).json({ error: error.message })
  }
})

// ✅ Fetch all prices from Stripe
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

    // ✅ Fetch all products with pagination
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

    // ✅ Fix Filtering Logic (Trim & Case-Insensitive)
    const allowedNames = ['learn', 'achieve', 'excel', 'common core- parents']
    const filteredProducts = allProducts.filter((product) =>
      allowedNames.includes(product.name.trim().toLowerCase()),
    )

    if (filteredProducts.length === 0) {
      return res.status(404).json({ message: 'No matching subscription plans found' })
    }

    // ✅ Format Data for Frontend
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
        expand: ['data.default_price'], // ✅ Ensure default_price is expanded
      }

      if (lastProductId) params.starting_after = lastProductId

      const response = await stripe.products.list(params)

      // ✅ Filter out excluded products
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

    // ✅ Ensure Price is Correctly Fetched
    const formattedProducts = allProducts.map((product) => {
      let priceAmount = 'Price Not Available' // ✅ Default message for missing price
      let currency = 'USD'

      // ✅ Check if product has a default price
      if (product.default_price && product.default_price.unit_amount) {
        priceAmount = (product.default_price.unit_amount / 100).toFixed(2)
        currency = product.default_price.currency.toUpperCase()
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || 'No description available',
        images: product.images.length > 0 ? product.images[0] : '/default-placeholder.png',
        price: priceAmount, // ✅ Ensuring correct price is returned
        currency: currency,
      }
    })

    // ✅ Debugging Log
    console.log('✅ Products with Prices:', formattedProducts)

    res.json(formattedProducts)
  } catch (error) {
    console.error('❌ Stripe API Error:', error)
    res.status(500).json({ error: 'Failed to fetch products. Please try again later.' })
  }
})

router.post('/create-payment-intent', async (req, res) => {
  try {
    let { amount, currency, userId, orderId, cartItems, userEmail } = req.body

    console.log('🔹 Received Payment Request:', {
      amount,
      currency,
      userId,
      orderId,
      cartItems,
      userEmail,
    })

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

    // ✅ Fix: Optimize metadata to avoid exceeding the 500-character limit
    const metadata = {
      userId: String(userId),
      orderId: String(orderId),
      userEmail: userEmail || 'no-email@example.com',
      cartSummary: cartItems.map((item) => item.name).join(', '), // ✅ Short summary only
      cartItemIds: JSON.stringify(cartItems.map((item) => item.id)), // ✅ Store only product IDs
      bookingLinks: JSON.stringify(cartItems.map((item) => calendlyMapping[item.name] || null)), // ✅ Store Booking Links in Metadata
    }

    console.log('📡 Sending Payment Intent with Metadata:', metadata)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata, // ✅ Correct metadata format
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

    // ✅ Ensure `user` exists
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

    // ✅ **Step 1: Save Payment in Database**
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

    // ✅ **Step 2: Call `addPurchasedClass` API**
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

    // ✅ **Step 3: Send Response to Frontend**
    res.json({ message: 'Payment captured & records updated successfully.', clearCart: true })
  } catch (error) {
    console.error('❌ Error Capturing Stripe Payment:', error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error })
  }
})

// ✅ Fetch Payment Details (Test Mode)
router.get('/payment-details/:paymentIntentId', async (req, res) => {
  try {
    const paymentIntentId = req.params.paymentIntentId

    // ✅ Validate Payment Intent ID (Must start with "pi_")
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return res.status(400).json({ error: 'Invalid Payment Intent ID.' })
    }

    // ✅ Retrieve Payment Intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    console.log(`✅ Payment Retrieved: ID=${paymentIntent.id}, Status=${paymentIntent.status}`)

    // ✅ Send only necessary details (Avoid exposing sensitive data)
    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert cents to dollars
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method_types[0] || 'unknown',
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    })
  } catch (error) {
    console.error('❌ Stripe API Error:', error.message)

    // ✅ Handle Different Stripe Errors Gracefully
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
  let event;
  const sig = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook Signature Verification Failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Received Stripe Webhook Event:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    console.log('✅ Payment Intent Succeeded Event Triggered');
    const paymentIntent = event.data.object;

    // ✅ Extract User & Cart Data
    const userId = paymentIntent.metadata?.userId;
    const cartSummary = paymentIntent.metadata?.cartSummary?.split(', ') || [];
    const userEmail = paymentIntent.metadata?.userEmail || 'No email provided';

    console.log('🔹 User ID:', userId);
    console.log('🛒 Purchased Items:', cartSummary);

    if (!userId || cartSummary.length === 0) {
      console.warn('⚠️ Missing user ID or cart summary. Skipping update.');
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    try {
      // ✅ Fetch user first to check for existing purchases
      const user = await Register.findById(userId);

      if (!user) {
        console.error('❌ Error: User not found in database!');
        return res.status(404).json({ error: 'User not found' });
      }

      // ✅ **Send Welcome Email**
      console.log(`📧 Sending Welcome Email to: ${userEmail}`);
      let welcomeSubject = `🎉 Welcome to Rockstar Math, ${user.username}!`;
      let welcomeHtml = `<div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
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
      </div>`;

      await sendEmail(userEmail, welcomeSubject, '', welcomeHtml);
      console.log('✅ Welcome email sent successfully!');

      // ✅ Track existing purchased classes to prevent duplicates
      const existingClasses = new Set(user.purchasedClasses.map(cls => cls.name.toLowerCase().trim()));

      // ✅ Filter new purchases to avoid duplicate entries
      const purchasedItems = cartSummary
        .filter(item => !existingClasses.has(item.toLowerCase().trim())) // ✅ Prevent duplicates
        .map(item => ({
          name: item,
          sessionCount: sessionMapping[item] || 0,
          remainingSessions: sessionMapping[item] || 0,
          bookingLink: calendlyMapping[item] || null,
          status: "Active",
        }));

      if (purchasedItems.length > 0) {
        await Register.findByIdAndUpdate(userId, {
          $push: { purchasedClasses: { $each: purchasedItems } }
        }, { new: true });
      } else {
        console.log("⚠️ No new purchased classes to add.");
      }

      // ✅ Continue with Zoom links, Calendly, Coupons, and Emails (No changes needed below)
      const activeCoupons = await getActiveCoupons();
      console.log('🎟 Active Coupons from Stripe:', activeCoupons);

      let userCoupons = activeCoupons.filter((coupon) => {
        return cartSummary.some((item) => {
          return item.toLowerCase().includes(coupon.code.toLowerCase());
        });
      });

      console.log('🛒 Purchased Items from Metadata:', cartSummary);

      let zoomLinks = [];
      if (['Learn', 'Achieve', 'Excel'].some((course) => cartSummary.includes(course))) {
        zoomLinks = zoomCourseMapping;
      }

      const hasCommonCore = cartSummary.some(
        (item) => item.toLowerCase() === 'common core for parents'
      );
      if (hasCommonCore) {
        zoomLinks.push(COMMONCORE_ZOOM_LINK);
      }

      let calendlyLinks = [];
      cartSummary.forEach((item) => {
        const formattedItemName = item.trim().toLowerCase();
        Object.keys(calendlyMapping).forEach((calendlyKey) => {
          if (formattedItemName === calendlyKey.toLowerCase().trim()) {
            calendlyLinks.push({
              name: item,
              link: calendlyMapping[calendlyKey],
            });
          }
        });
      });

      let appliedCoupons = [];
      cartSummary.forEach((item) => {
        let matchedCoupon = activeCoupons.find((coupon) => {
          if (item === 'Learn' && coupon.percent_off === 10) return true;
          if (item === 'Achieve' && coupon.percent_off === 30) return true;
          if (item === 'Excel' && coupon.percent_off === 20) return true;
          return false;
        });

        if (matchedCoupon && matchedCoupon.code) {
          appliedCoupons.push({
            code: matchedCoupon.code,
            percent_off: matchedCoupon.percent_off,
            expires: matchedCoupon.expires,
          });
        }
      });

      if (appliedCoupons.length > 0) {
        appliedCoupons = appliedCoupons.filter((coupon) => coupon.code && coupon.code.trim() !== '');
        if (appliedCoupons.length > 0) {
          await Register.findByIdAndUpdate(userId, {
            $push: { coupons: { $each: appliedCoupons } },
          });
        }
      }

      if (calendlyLinks.length > 0) {
        await Register.findByIdAndUpdate(userId, {
          $push: { calendlyBookings: { $each: calendlyLinks } },
        });
      }

      console.log('🛒 Purchased Items from Metadata:', cartSummary);
      console.log('📅 Available Calendly Links:', Object.keys(calendlyMapping));

      console.log('📧 Sending Email with Zoom Links & Calendly Links:', zoomLinks, calendlyLinks);
      console.log('🎟 Sending Email with Coupons:', appliedCoupons);

      const emailHtml = generateEmailHtml(user, zoomLinks, appliedCoupons, calendlyLinks);

      await sendEmail(userEmail, '📚 Your Rockstar Math Purchase Details', '', emailHtml);

      console.log('✅ Purchase confirmation email sent successfully!');
      return res.status(200).json({ message: 'Purchase updated & all emails sent!' });

    } catch (error) {
      console.error('❌ Error processing purchase:', error);
      return res.status(500).json({ error: 'Error updating purchased classes' });
    }
  }

  res.sendStatus(200);
});


// ✅ Function to Generate Email HTML
function generateEmailHtml(user, zoomLinks, userCoupons, calendlyLinks) {
  let detailsHtml = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2C3E50;">🎉 Hello ${user.username}!</h2>
          <p>We're excited to have you on board! 🚀 Below are your registration details.</p>

          <h3 style="color: #007bff;">🔗 Available Courses & Registration Links:</h3>
          <ul style="list-style-type: none; padding: 0;">
  `

  if (zoomLinks.length > 0) {
    detailsHtml += `<h3>🔗 Your Course Zoom Links:</h3><ul>`
    zoomLinks.forEach((course) => {
      detailsHtml += `<li>📚 <b>${course.name}</b> – <a href="${course.link}" target="_blank">Register Here</a></li>`
    })
    detailsHtml += `</ul>`
  }

  if (userCoupons.length > 0) {
    detailsHtml += `<h3 style="color: #d9534f;">🎟 Your Exclusive Discount Coupons:</h3>`
    userCoupons.forEach((coupon) => {
      detailsHtml += `<p><b>Coupon Code:</b> ${coupon.code} - ${coupon.percent_off}% off (Expires: ${coupon.expires})</p>`
    })
  }

  if (calendlyLinks.length > 0) {
    // ✅ Ensure Calendly Links are Shown
    detailsHtml += `<h3>📅 Your Scheduled Calendly Sessions:</h3><ul>`
    calendlyLinks.forEach((session) => {
      detailsHtml += `<li>📚 <b>${session.name}</b> – <a href="${session.link}" target="_blank">Book Now</a></li>`
    })
    detailsHtml += `</ul>`
  }

  detailsHtml += `</div>`

  return detailsHtml
}

module.exports = router

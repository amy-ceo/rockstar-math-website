const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const Register = require("../models/registerModel"); // Ensure Register Model is imported
const sendEmail = require("../utils/emailSender");
const paypalClient = require("../config/paypal");


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

};

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

};

// ✅ Function to Generate Email HTML
function generateEmailHtml(user, zoomLinks, userCoupons) {
  let detailsHtml = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2C3E50;">🎉 Hello ${user.username}!</h2>
          <p>We're excited to have you on board! 🚀 Below are your registration details.</p>

          <h3 style="color: #007bff;">🔗 Available Courses & Registration Links:</h3>
          <ul style="list-style-type: none; padding: 0;">
  `;

  if (zoomLinks.length > 0) {
    detailsHtml += `<h3>🔗 Your Course Zoom Links:</h3><ul>`;
    zoomLinks.forEach((course) => {
      detailsHtml += `<li>📚 <b>${course.name}</b> – <a href="${course.link}" target="_blank">Register Here</a></li>`;
    });
    detailsHtml += `</ul>`;
  }

  if (userCoupons.length > 0) {
    detailsHtml += `<h3 style="color: #d9534f;">🎟 Your Exclusive Discount Coupons:</h3>`;
    userCoupons.forEach((coupon) => {
      detailsHtml += `<p><b>Coupon Code:</b> ${coupon.code} - ${coupon.percent_off}% off (Expires: ${coupon.expires})</p>`;
    });
  }

  detailsHtml += `
          <h3 style="color: #5bc0de;">📌 Next Steps:</h3>
          <ol>
              <li>✅ Select one course from the list above and complete your registration.</li>
              <li>📩 Check your email for confirmation details.</li>
              <li>🖥 Log in to your Dashboard to view your scheduled tutoring sessions.</li>
          </ol>
      </div>
  `;

  return detailsHtml;
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
];
const COMMONCORE_ZOOM_LINK = {
  name: '📚  Common Core for Parents',
  link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIT3Sfbpyg#/registration',
}

// 🎯 Create PayPal Order
const calculateItemTotal = (cartItems) => {
  return cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * (item.quantity ? item.quantity : 1),
    0
  ).toFixed(2);
};

exports.createOrder = async (req, res) => {
  try {
    let { userId, amount, cartItems } = req.body;

    amount = parseFloat(amount);
    if (!userId || isNaN(amount) || !cartItems || cartItems.length === 0 || amount <= 0) {
      console.error("❌ Invalid Request Data:", { userId, amount, cartItems });
      return res.status(400).json({ error: "Invalid request data" });
    }

    // ✅ Calculate Item Total from Cart
    const calculatedItemTotal = calculateItemTotal(cartItems);
    if (parseFloat(calculatedItemTotal) !== parseFloat(amount)) {
      console.error(`❌ ITEM TOTAL MISMATCH: Expected ${amount}, Got ${calculatedItemTotal}`);
      return res.status(400).json({ error: `ITEM TOTAL MISMATCH: Expected ${amount}, Got ${calculatedItemTotal}` });
    }

    console.log("🛒 Creating PayPal Order:", { userId, amount, cartItems });

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: calculatedItemTotal,
            breakdown: {
              item_total: { currency_code: "USD", value: calculatedItemTotal },
            },
          },
          description: "E-commerce Payment",
          items: cartItems.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: "USD",
              value: parseFloat(item.price).toFixed(2),
            },
            quantity: item.quantity ? Number(item.quantity).toString() : "1",
            category: "DIGITAL_GOODS",
          })),
        },
      ],
    });

    const order = await paypalClient.execute(request);
    if (!order.result || !order.result.id) {
      console.error("❌ PayPal Order Creation Failed - No ID Returned");
      return res.status(500).json({ error: "PayPal order creation failed" });
    }

    res.json({ orderId: order.result.id });
  } catch (error) {
    console.error("❌ PayPal Order Error:", error.message || error);
    res.status(500).json({ error: "Internal Server Error", details: error.message || error });
  }
};

// 🎯 Capture PayPal Order & Update Purchased Classes
exports.captureOrder = async (req, res) => {
  try {
      const { orderId, user } = req.body;

      if (!orderId || !user || !user._id || !user.billingEmail || !Array.isArray(user.cartItems) || user.cartItems.length === 0) {
          console.error("❌ Missing required fields:", { orderId, user });
          return res.status(400).json({ error: "Missing required fields or empty cart items" });
      }

      console.log("🛒 Capturing PayPal Order:", orderId);
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
      captureRequest.requestBody({});

      let captureResponse;
      try {
          captureResponse = await paypalClient.execute(captureRequest);
          console.log("✅ Capture Response:", captureResponse.result);
      } catch (captureError) {
          console.error("❌ PayPal Capture Error:", captureError);
          return res.status(400).json({ error: "PayPal capture failed", details: captureError.message });
      }

      if (!captureResponse.result || captureResponse.result.status !== "COMPLETED") {
          console.error("❌ PayPal Capture Failed - Status:", captureResponse.result.status);
          return res.status(400).json({ error: "Payment capture failed", details: captureResponse.result });
      }

      const captureDetails = captureResponse.result.purchase_units[0].payments?.captures?.[0];

      if (!captureDetails) {
          console.error("❌ Capture Details Missing:", captureResponse.result);
          return res.status(400).json({ error: "Capture details missing from PayPal response" });
      }

      const amount = captureDetails.amount.value;
      const currency = captureDetails.amount.currency_code;
      const paymentIntentId = captureDetails.id;

      // ✅ Ensure paymentIntentId is unique before saving
      const existingPayment = await Payment.findOne({ paymentIntentId });
      if (existingPayment) {
          console.warn("⚠️ Duplicate Payment Detected, Skipping Save:", paymentIntentId);
          return res.json({ message: "Payment already recorded.", payment: captureResponse.result });
      }

      // ✅ Save Payment Record
      const newPayment = new Payment({
          orderId,
          paymentIntentId,
          userId: user._id,
          billingEmail: user.billingEmail,
          amount,
          currency,
          status: "Completed",
          paymentMethod: "PayPal",
          cartItems: user.cartItems || [],
      });

      await newPayment.save();
      console.log("✅ Payment Record Saved!");

      // ✅ **Fetch Active Coupons**
      const activeCoupons = await getActiveCoupons();
      console.log("🎟 Active Coupons from Stripe:", activeCoupons);

      // ✅ **Generate Calendly & Zoom Links**
      const proxyBaseUrl = "https://backend-production-cbe2.up.railway.app/api/proxy-calendly";
      let calendlyLinks = [];
      user.cartItems.forEach((item) => {
          const formattedItemName = item.name.trim().toLowerCase();
          Object.keys(calendlyMapping).forEach((calendlyKey) => {
              if (formattedItemName === calendlyKey.toLowerCase().trim()) {
                  calendlyLinks.push({
                      name: item.name,
                      link: `${proxyBaseUrl}?userId=${user._id}&session=${encodeURIComponent(item.name)}`,
                      quantity: sessionMapping[item.name] || 1
                  });
              }
          });
      });

      let zoomLinks = [];
      if (["Learn", "Achieve", "Excel"].some((course) => user.cartItems.map((item) => item.name).includes(course))) {
          zoomLinks = zoomCourseMapping;
      }

      const hasCommonCore = user.cartItems.some((item) => item.name.toLowerCase() === "common core for parents");
      if (hasCommonCore) {
          zoomLinks.push(COMMONCORE_ZOOM_LINK);
      }

      // ✅ **Match Coupons with Purchased Courses**
      let appliedCoupons = [];
      user.cartItems.forEach((item) => {
          let matchedCoupon = activeCoupons.find((coupon) => {
              if (item.name === "Learn" && coupon.percent_off === 10) return true;
              if (item.name === "Achieve" && coupon.percent_off === 30) return true;
              if (item.name === "Excel" && coupon.percent_off === 20) return true;
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
          appliedCoupons = appliedCoupons.filter((coupon) => coupon.code && coupon.code.trim() !== "");
          if (appliedCoupons.length > 0) {
              await Register.findByIdAndUpdate(user._id, {
                  $push: { coupons: { $each: appliedCoupons } },
              });
          }
      }

      // ✅ **Send Welcome Email (MUST HAVE)**
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

      await sendEmail(user.billingEmail, "🎉 Welcome to Rockstar Math", "", welcomeHtml);
      console.log("✅ Welcome Email Sent!");

      // ✅ **Send Email with Calendly Links**
      let detailsHtml = `<h3>📅 Your Scheduled Calendly Sessions:</h3>
      <p>Thank you for purchasing! Below is your registration link and important instructions on how to book your sessions:</p>
      <ul>`;

      calendlyLinks.forEach((session) => {
          detailsHtml += `<li>📚 <b>${session.name}</b> – Click the link below <b>${session.quantity}</b> times to book all your sessions.
          <br/>
          <a href="${session.link}" target="_blank"><b>Book Now</b></a></li>`;
      });

      detailsHtml += `</ul>
      <p>📌 Once you have booked all your sessions, head over to your <b>RockstarMath Dashboard</b> where you can:</p>
      <ul>
          <li>📅 View all your scheduled sessions</li>
          <li>✏️ Reschedule sessions if needed</li>
          <li>❌ Cancel any session</li>
          <li>🛒 Purchase additional sessions</li>
      </ul>`;

      await sendEmail(user.billingEmail, "📚 Your Rockstar Math Purchase Details", "", detailsHtml);
      console.log("✅ Purchase Confirmation Email Sent!");

      // ✅ **Ensure Frontend Clears Cart**
      res.json({ message: "Payment captured & records updated successfully.", clearCart: true });

  } catch (error) {
      console.error("❌ Error Capturing PayPal Payment:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message || error });
  }
};

  

// 🎯 PayPal Webhook for Order Capture
exports.paypalWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("🔔 Received PayPal Webhook Event:", JSON.stringify(event, null, 2));

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource.id;
      console.log("✅ Payment Captured via Webhook:", orderId);

      await Payment.updateOne({ orderId }, { status: "Completed" });
    } else {
      console.warn("⚠️ Webhook received but not a capture event:", event.event_type);
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    res.status(500).json({ error: "Webhook processing failed", details: error.message });
  }
};

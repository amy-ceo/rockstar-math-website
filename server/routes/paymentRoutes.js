const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sendEmail = require("../utils/emailSender");

const router = express.Router();

// ✅ Stripe Webhook to Handle Payment Events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    event = JSON.parse(req.body);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // ✅ Handle Stripe Payment Success
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // ✅ Fetch User Email & Subscription Details
    const userEmail = session.customer_details.email;
    const customerName = session.customer_details.name || "Rockstar";
    const amountPaid = session.amount_total / 100; // Convert cents to dollars
    const currency = session.currency.toUpperCase();
    const purchasedPlan = session.metadata.plan_name; // Ensure this is set in metadata

    console.log("✅ Payment Successful:", session);

    // ✅ User Confirmation Email
    const userEmailContent = `
      <h2>Skate Through Math with Rockstar Math! 🛹🚀</h2>
      <p>Dear <b>${customerName}</b>,</p>
      <p>You’ve just taken a big step toward committing to learning the math you'll need to reach your dreams—welcome to <b>Rockstar Math</b>! 🎉</p>
      <p>With the right support, you can stay on track, overcome challenges, and skate through with confidence.</p>

      <h3>📌 Here’s how you can stay on track:</h3>
      <ul>
        <li>🌟 <b>Group Tutoring</b> – Register <a href="https://www.rockstarmath.com/group-tutoring">here</a>.</li>
        <li>🎯 <b>Private Tutoring</b> – Book a session <a href="https://www.rockstarmath.com/private-tutoring">here</a>.</li>
        <li>📚 <b>Live Courses</b> – If you've enrolled, keep an eye out for details on your upcoming classes.</li>
      </ul>

      <p>Skateboarding and math have something in common—it’s not about never falling, but about getting back up, pushing forward, and mastering it.</p>
      <p>With <b>Rockstar Math</b> by your side, you’ll have the support you need to keep rolling toward your goals. 🚀</p>

      <h3>🔹 Payment Summary:</h3>
      <p><b>Plan:</b> ${purchasedPlan}</p>
      <p><b>Amount Paid:</b> ${currency} ${amountPaid}</p>

      <br/>
      <p>We’re excited to be part of your journey.</p>
      <p>Best,</p>
      <p><b>Amy Gemme</b><br/>Rockstar Math Team<br/>📞 510-410-4963<br/><a href="https://www.rockstarmath.com">www.rockstarmath.com</a></p>
    `;

    await sendEmail(userEmail, "Welcome to Rockstar Math! 🚀", userEmailContent);

    // ✅ Admin Notification Email
    const adminEmailContent = `
      <h2>New Subscription Alert 🚀</h2>
      <p>User <b>${userEmail}</b> has subscribed to <b>${purchasedPlan}</b>.</p>
      <p>Amount Paid: <b>${currency} ${amountPaid}</b></p>
      <p>Check Stripe Dashboard for more details.</p>
    `;

    await sendEmail(process.env.ADMIN_EMAIL, "New Subscription Alert", adminEmailContent);
  }

  res.json({ received: true });
});

module.exports = router;

const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const Register = require("../models/registerModel"); // Ensure Register Model is imported
const sendEmail = require("../utils/emailSender");
const paypalClient = require("../config/paypal");


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
      const paymentIntentId = captureDetails.id; // ✅ Use PayPal capture ID as `paymentIntentId`
  
      // ✅ Ensure `paymentIntentId` is unique before saving
      const existingPayment = await Payment.findOne({ paymentIntentId });
      if (existingPayment) {
        console.warn("⚠️ Duplicate Payment Detected, Skipping Save:", paymentIntentId);
        return res.json({ message: "Payment already recorded.", payment: captureResponse.result });
      }
  
      // ✅ Save Payment Record
      try {
        console.log("🔹 Saving Payment Details...");
        const newPayment = new Payment({
          orderId,
          paymentIntentId, // ✅ Save unique payment ID
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
      } catch (saveError) {
        console.error("❌ Error Saving Payment:", saveError);
        return res.status(500).json({ error: "Database error while saving payment.", details: saveError.message });
      }
  

     // ✅ Fetch Active Coupons
     const activeCoupons = await getActiveCoupons();
     console.log("🎟 Active Coupons from Stripe:", activeCoupons);
 
     // ✅ Match Coupons Based on Course Name
     let userCoupons = activeCoupons.filter((coupon) => {
       return user.cartItems.some((item) => {
         return item.name.toLowerCase().includes(coupon.code.toLowerCase());
       });
     });
 
     console.log("🛒 Purchased Items from Cart:", user.cartItems.map((item) => item.name));
 
     // ✅ Fetch Zoom Links
     let zoomLinks = [];
     if (["Learn", "Achieve", "Excel"].some((course) => user.cartItems.map((item) => item.name).includes(course))) {
       zoomLinks = zoomCourseMapping;
     }
 
     // ✅ **Check if User Purchased "Common Core for Parents" Course**
     const hasCommonCore = user.cartItems.some((item) => item.name.toLowerCase() === "common core for parents");
     if (hasCommonCore) {
       zoomLinks.push(COMMONCORE_ZOOM_LINK); // ✅ Add the specific Common Core Zoom link
     }
 
     // ✅ Apply Discount Coupons Based on Course Name (Same Logic as `addPurchasedClass`)
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
 
     // ✅ Save Coupons in User's Database
     if (appliedCoupons.length > 0) {
       appliedCoupons = appliedCoupons.filter((coupon) => coupon.code && coupon.code.trim() !== "");
       if (appliedCoupons.length > 0) {
         await Register.findByIdAndUpdate(user._id, {
           $push: { coupons: { $each: appliedCoupons } },
         });
       }
     }
 
     console.log("📧 Sending Email with Zoom Links:", zoomLinks);
     console.log("🎟 Sending Email with Coupons:", appliedCoupons);
 
     const emailHtml = generateEmailHtml(user, zoomLinks, appliedCoupons);
 
 


      // ✅ Call `addPurchasedClass` API to add purchased items
      try {
        console.log("📡 Calling addPurchasedClass API...");
        const purchaseResponse = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/add-purchased-class`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              purchasedItems: user.cartItems.map(item => ({
                name: item.name,
                description: item.description || "No description available",
              })),
              userEmail: user.billingEmail,
            }),
          }
        );
  
        const purchaseResult = await purchaseResponse.json();
        console.log("✅ Purchased Classes API Response:", purchaseResult);
  
        if (!purchaseResponse.ok) {
          console.warn("⚠️ Issue updating purchased classes:", purchaseResult.message);
        }
      } catch (purchaseError) {
        console.error("❌ Error calling addPurchasedClass API:", purchaseError);
      }
  
      // ✅ Send Confirmation Email
      try {
        await sendEmail(
          user.billingEmail,
          `Order Confirmation - Your Purchase is Successful!`,
          `Your order ${orderId} was successful.`,
          "<h3>Thank you!</h3>"
        );
        console.log("✅ Confirmation Email Sent");
      } catch (emailError) {
        console.error("❌ Email Sending Failed:", emailError);
      }
      await sendEmail(user.billingEmail, "📚 Your Rockstar Math Purchase Details", "", emailHtml);


      // ✅ Cart Empty ka Response Frontend ko bhejna
      // res.json({ message: "Payment captured & records updated successfully.", clearCart: true });

      res.json({ message: "Payment captured & records updated successfully.", payment: captureResponse.result });
  
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

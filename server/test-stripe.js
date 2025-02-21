const stripe = require('stripe')('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'); // 🛑 Replace with your actual Stripe Secret Key

async function getAllCoupons() {
  try {
    const coupons = await stripe.coupons.list({ limit: 10 }); // Fetch last 10 coupons
    console.log("🎟 Available Coupons:");
    coupons.data.forEach(coupon => {
      console.log(`🆔 ${coupon.id} | 💰 ${coupon.percent_off}% Off | 📆 ${coupon.duration}`);
    });
  } catch (error) {
    console.error("❌ Error Fetching Coupons:", error.message);
  }
}

getAllCoupons();
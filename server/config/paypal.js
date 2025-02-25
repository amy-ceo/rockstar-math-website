const paypal = require("@paypal/checkout-server-sdk");

// ✅ Debug: Ensure environment variables are loaded
console.log("🚀 PayPal Mode:", process.env.PAYPAL_MODE);
console.log("✅ PayPal Client ID:", process.env.PAYPAL_CLIENT_ID ? "Exists" : "MISSING");
console.log("✅ PayPal Secret:", process.env.PAYPAL_SECRET ? "Exists" : "MISSING");

// ✅ Ensure correct environment is used
const environment = 
    process.env.PAYPAL_MODE === "live"
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(environment);

module.exports = paypalClient;

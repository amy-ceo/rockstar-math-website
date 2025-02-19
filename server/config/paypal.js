const paypal = require("@paypal/checkout-server-sdk");

// Set up PayPal environment based on mode (LIVE or SANDBOX)
const environment =
    process.env.PAYPAL_MODE === "live"
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(environment);

module.exports = paypalClient;

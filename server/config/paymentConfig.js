const paypal = require("@paypal/checkout-server-sdk");
require("dotenv").config();  // ✅ Load .env file

const environment =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? new paypal.core.LiveEnvironment("AeomWj4L8mlq-ezy4Uv0He0-zb4HV5rYqv-qPDczww0pqQAirAxpF-kv33JYwDvn9ChImPjuu5eB", "AeomWj4L8mlq-ezy4Uv0He0-zb4HV5rYqv-qPDczww0pqQAirAxpF-kv33JYwDvn9ChImPjuu5eB1_ak")
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

module.exports = client;

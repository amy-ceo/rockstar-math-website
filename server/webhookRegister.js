const axios = require('axios');
require('dotenv').config();

const registerCalendlyWebhook = async () => {
    try {
        const calendlyApiKey = "M5qE1g46OA97prYxefGPdQOp5se2a8wLRfUmfoQWbw4"; // Ensure API Key is in .env
        const webhookUrl = "https://backend-production-cbe2.up.railway.app/api/webhook/calendly"; // Replace with your actual webhook URL
        const organizationId = "https://api.calendly.com/organizations/AADABSJONSZO3TK2"; // Your Calendly Org ID

        if (!calendlyApiKey) {
            throw new Error("⚠️ Missing Calendly API Key. Set it in .env!");
        }

        const response = await axios.post(
            'https://api.calendly.com/webhook_subscriptions',
            {
                url: webhookUrl,
                events: ["invitee.created"], // Event when a user books a session
                organization: organizationId
            },
            {
                headers: {
                    "Authorization": `Bearer ${calendlyApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log('✅ Calendly Webhook Registered:', response.data);
    } catch (error) {
        console.error('❌ Error Registering Calendly Webhook:', error.response ? error.response.data : error.message);
    }
};

// Call function to register webhook
registerCalendlyWebhook();

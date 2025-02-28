const axios = require('axios');
require('dotenv').config();

const registerCalendlyWebhook = async () => {
    try {
        const calendlyApiKey = "M5qE1g46OA97prYxefGPdQOp5se2a8wLRfUmfoQWbw4"; // Set in .env
        const webhookUrl = "https://backend-production-cbe2.up.railway.app/api/webhook/calendly"; // Replace with your actual endpoint

        const response = await axios.post(
            'https://api.calendly.com/webhook_subscriptions',
            {
                url: webhookUrl,
                events: ["invitee.created"], // Webhook will trigger when a meeting is booked
                organization: "https://api.calendly.com/organizations/users/me",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${calendlyApiKey}`,
                },
            }
        );

        console.log('✅ Calendly Webhook Registered:', response.data);
    } catch (error) {
        console.error('❌ Error Registering Calendly Webhook:', error.response ? error.response.data : error.message);
    }
};

// Call this function once when the server starts
registerCalendlyWebhook();

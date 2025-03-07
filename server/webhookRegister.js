const axios = require('axios');
require('dotenv').config();

const registerCalendlyWebhook = async () => {
    try {
        const calendlyApiKey = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQwNzczMDgxLCJqdGkiOiJiYjdiYzE0ZC05OWU4LTRhZmUtYjdkNy01MDZlNDAxYTMzNzkiLCJ1c2VyX3V1aWQiOiJCRkZEQ1ZMSk1TT0RLRDdXIn0.3DXMEQ1-8ksgLuFWFZ6y5oqDYxb_HbUcNacovXWkdinfZjM5hVPGs-4yjgTkENprR1WUhtI1ersucpDjieAmZg"; // Load API key from .env
        const webhookUrl = "https://backend-production-cbe2.up.railway.app/api/webhook/calendly"; // Your Webhook URL

        if (!calendlyApiKey) {
            throw new Error("⚠️ Missing Calendly API Key. Set it in .env!");
        }

        const organizationId = "https://api.calendly.com/organizations/AADABSJONSZO3TK2"; // ✅ Use correct Org ID

        // ✅ Register the Webhook with Correct Events
        const response = await axios.post(
            'https://api.calendly.com/webhook_subscriptions',
            {
                url: webhookUrl, // Webhook URL to receive event data
                events: ["invitee.created", "invitee.canceled"], // ✅ Fix: Correct Event Types
                organization: organizationId, // ✅ Fix: Correct organization ID
                scope: "organization" // ✅ Fix: Must be "organization"
            },
            {
                headers: {
                    "Authorization": `Bearer ${calendlyApiKey}`, // Bearer token for authentication
                    "Content-Type": "application/json"
                }
            }
        );

        console.log('✅ Calendly Webhook Registered Successfully:', response.data);
    } catch (error) {
        console.error('❌ Error Registering Calendly Webhook:', error.response ? error.response.data : error.message);
    }
};

// Run the function to register the webhook
registerCalendlyWebhook();

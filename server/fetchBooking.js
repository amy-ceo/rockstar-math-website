const axios = require('axios');
require('dotenv').config();

const fetchScheduledEvents = async () => {
    try {
        const calendlyApiKey = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQwNzczMDgxLCJqdGkiOiJiYjdiYzE0ZC05OWU4LTRhZmUtYjdkNy01MDZlNDAxYTMzNzkiLCJ1c2VyX3V1aWQiOiJCRkZEQ1ZMSk1TT0RLRDdXIn0.3DXMEQ1-8ksgLuFWFZ6y5oqDYxb_HbUcNacovXWkdinfZjM5hVPGs-4yjgTkENprR1WUhtI1ersucpDjieAmZg"; // Load from .env
        const organizationId = "https://api.calendly.com/organizations/AADABSJONSZO3TK2"; // Replace with your actual Org ID

        if (!calendlyApiKey) {
            throw new Error("⚠️ Missing Calendly API Key. Set it in .env!");
        }

        const response = await axios.get(
            `https://api.calendly.com/scheduled_events?organization=${organizationId}`,
            {
                headers: {
                    "Authorization": `Bearer ${calendlyApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log('✅ Fetched Scheduled Events:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Error Fetching Scheduled Events:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Run function to test fetching events
fetchScheduledEvents();

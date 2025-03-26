const axios = require('axios')
require('dotenv').config()

const registerCalendlyWebhook = async () => {
  try {
    const calendlyApiKey = process.env.CALENDLY_API_KEY // Make sure you're loading it from .env
    const webhookUrl = 'https://backend-production-cbe2.up.railway.app/api/webhook/calendly' // Your Webhook URL

    if (!calendlyApiKey) {
      throw new Error('⚠️ Missing Calendly API Key. Set it in .env!')
    }

    const organizationId = 'AADABSJONSZO3TK2' // Use only the Org ID part, not the full URL

    // Register the Webhook with Correct Events
    const response = await axios.post(
      'https://api.calendly.com/webhook_subscriptions',
      {
        url: webhookUrl, // Webhook URL to receive event data
        events: ['invitee.created', 'invitee.canceled'], // Event types to listen to
        organization: `https://api.calendly.com/organizations/${organizationId}`, // Correct organization URL format
        scope: 'organization', // Scope must be "organization"
      },
      {
        headers: {
          Authorization: `Bearer ${calendlyApiKey}`, // Bearer token for authentication
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Calendly Webhook Registered Successfully:', response.data)
  } catch (error) {
    console.error(
      '❌ Error Registering Calendly Webhook:',
      error.response ? error.response.data : error.message,
    )
  }
}

// Run the function to register the webhook
registerCalendlyWebhook()

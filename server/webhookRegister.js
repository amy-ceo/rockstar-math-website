const axios = require('axios')
require('dotenv').config()

const deleteAndRecreateWebhook = async () => {
  try {
    const calendlyApiKey = process.env.CALENDLY_API_KEY
    const webhookUrl = 'https://backend-production-cbe2.up.railway.app/api/webhook/calendly'
    const organizationId = 'AADABSJONSZO3TK2'

    if (!calendlyApiKey) throw new Error('Missing Calendly API Key in .env!')

    // 1. List and delete existing webhooks
    const existingWebhooks = await axios.get('https://api.calendly.com/webhook_subscriptions', {
      params: {
        organization: `https://api.calendly.com/organizations/${organizationId}`,
        scope: 'organization',
      },
      headers: {
        Authorization: `Bearer ${calendlyApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    for (const webhook of existingWebhooks.data.collection) {
      await axios.delete(webhook.uri, {
        headers: { Authorization: `Bearer ${calendlyApiKey}` },
      })
      console.log(`🗑️ Deleted: ${webhook.uri}`)
    }

    // 2. Create new webhook
    const newWebhook = await axios.post(
      'https://api.calendly.com/webhook_subscriptions',
      {
        url: webhookUrl,
        events: ['invitee.created', 'invitee.canceled'],
        organization: `https://api.calendly.com/organizations/${organizationId}`,
        scope: 'organization',
      },
      {
        headers: {
          Authorization: `Bearer ${calendlyApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ New Webhook:', {
      uri: newWebhook.data.uri,
      state: newWebhook.data.state,
      url: newWebhook.data.callback_url,
    })
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

deleteAndRecreateWebhook()

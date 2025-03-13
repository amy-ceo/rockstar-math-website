const Register = require('../models/registerModel');
const sendEmail = require('../utils/emailSender');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment-timezone');

// Webhook Signature Verification
const verifyWebhookSignature = (req, signingKey) => {
  const signature = req.headers['cal-signature']; // Corrected header key
  const payload = JSON.stringify(req.body);

  const computedSignature = crypto
    .createHmac('sha256', signingKey)
    .update(payload)
    .digest('base64');

  console.log("📢 Computed Signature:", computedSignature);
  console.log("📢 Incoming Signature:", signature);

  return signature === computedSignature;
};

// Stripe Webhook Handler
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook Signature Verification Failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Received Stripe Webhook Event:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata?.userId;
    const userEmail = paymentIntent.metadata?.userEmail;

    if (!userId || !userEmail) {
      console.error('❌ Missing userId or userEmail in Stripe webhook payload');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const user = await Register.findById(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      // Update purchased classes and session counter
      user.purchasedClasses.forEach((cls) => {
        if (cls.status === 'Active') {
          cls.remainingSessions += cls.sessionCount; // Reset or add sessions based on payment
        }
      });

      await user.save();
      console.log('✅ Stripe payment processed and sessions updated for user:', userId);

      // Send confirmation email to billing and scheduling emails
      const recipients = getRecipientEmails(user);
      const emailSubject = `🎉 Payment Successful – Rockstar Math Tutoring`;
      const emailHtml = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #2C3E50;">🎉 Payment Successful!</h2>
            <p>Hi <b>${user.username}</b>,</p>
            <p>Your payment has been successfully processed. You now have access to your purchased sessions.</p>
            <p>Best Regards,<br>Rockstar Math Tutoring</p>
        </div>
      `;

      await sendEmail(recipients, emailSubject, '', emailHtml);
      console.log(`✅ Payment confirmation email sent to ${recipients}`);

      return res.status(200).json({ message: 'Stripe payment processed successfully' });
    } catch (error) {
      console.error('❌ Error processing Stripe webhook:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.sendStatus(200);
};

// Calendly Webhook Handler
exports.calendlyWebhook = async (req, res) => {
  try {
    const signingKey = process.env.CALENDLY_SIGNING_KEY;
    if (!verifyWebhookSignature(req, signingKey)) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.payload) {
      console.error('❌ Invalid Webhook Payload:', req.body);
      return res.status(400).json({ error: 'Invalid Webhook Payload' });
    }

    const payload = req.body.payload;

    // Extract Invitee & Event Details
    const inviteeEmail = payload?.email || '❌ Missing';
    const eventName = payload?.name || payload?.event?.name || '❌ Missing';
    const eventUri = payload?.event?.uri || payload?.event?.invitee?.uri || payload?.scheduled_event?.uri || '❌ Missing';

    // Normalize URL for consistency
    const normalizeUrl = (url) => url?.split('?')[0].trim().toLowerCase();
    const normalizedEventUri = eventUri !== '❌ Missing' ? normalizeUrl(eventUri) : null;

    // Extract `startTime` and `endTime`
    const startTime = moment.tz(
      payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time,
      payload?.timezone || payload?.event?.location?.timezone || 'UTC'
    ).toDate();

    const endTime = moment.tz(
      payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time,
      payload?.timezone || payload?.event?.location?.timezone || 'UTC'
    ).toDate();

    const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing';

    // Validation: Ensure required fields are present
    if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user in MongoDB using invitee email
    const user = await Register.findOne({
      $or: [{ billingEmail: inviteeEmail }, { schedulingEmails: inviteeEmail }],
    });

    if (!user) {
      console.error('❌ No user found:', inviteeEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User Found:', user);

    if (!normalizedEventUri) {
      console.error('❌ Missing valid Calendly Event URI');
      return res.status(400).json({ error: 'Invalid or missing Calendly Event URL' });
    }

    // Check if Event Already Exists in User's bookedSessions
    const eventAlreadyExists = user.bookedSessions.some(
      (session) => session.calendlyEventUri === normalizedEventUri
    );

    if (eventAlreadyExists) {
      console.log(`⚠️ Duplicate Event Detected: ${eventName}. Skipping Booking.`);
      return res.status(200).json({ message: 'Event already stored, skipping' });
    }

    // Find Matching Purchased Class
    let purchasedClass = user.purchasedClasses.find((cls) => {
      return normalizeUrl(cls.bookingLink) === normalizedEventUri;
    });

    // If No Matching Class, Assign First Available One
    if (!purchasedClass) {
      console.warn(`⚠️ No valid purchased class found for user: ${inviteeEmail}`);

      if (user.purchasedClasses.length > 0) {
        purchasedClass = user.purchasedClasses.find((cls) => cls.status === "Active") || user.purchasedClasses[0];

        // If Class was Expired, Reactivate it
        purchasedClass.bookingLink = normalizedEventUri;
        purchasedClass.status = "Active";
        purchasedClass.remainingSessions = purchasedClass.sessionCount; // Reset Remaining Sessions

        user.markModified('purchasedClasses');
        await user.save();
        console.log(`🔄 Updated booking link & reactivated class for: ${normalizedEventUri}`);
      } else {
        return res.status(400).json({ error: "No valid purchased class for this booking." });
      }
    }

    // Ensure User Has Remaining Sessions
    if (purchasedClass.remainingSessions <= 0) {
      console.warn(`⚠️ User ${user.username} has no remaining sessions.`);
      return res.status(403).json({ error: "You have no remaining sessions left." });
    }

    // Deduct 1 Session
    purchasedClass.remainingSessions -= 1;
    user.markModified('purchasedClasses');

    if (purchasedClass.remainingSessions === 0) {
      purchasedClass.status = "Expired";
    }

    // Create New Booking Object
    const newBooking = {
      eventName,
      calendlyEventUri: normalizedEventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    };

    console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2));

    // Update User's bookedSessions
    user.bookedSessions.push(newBooking);

    // Save User with the updated session and class data
    await user.save();

    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);
    console.log(`✅ Session Booked: Remaining ${purchasedClass.remainingSessions} sessions.`);

    // Send Confirmation Email to Billing & Scheduling Emails
    const recipients = getRecipientEmails(user);
    const emailSubject = `📅 Your RockstarMath Booking Confirmation`;
    const emailHtml = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2C3E50;">📅 Your Session is Booked!</h2>
          <p>Hi <b>${user.username}</b>,</p>
          <p>Your session "<b>${eventName}</b>" has been successfully booked.</p>
          <p><b>Start Time:</b> ${startTime.toLocaleString()}</p>
          <p><b>End Time:</b> ${endTime.toLocaleString()}</p>
          <p><b>Time Zone:</b> ${timezone}</p>
          <p><b>Event Link:</b> <a href="${eventUri}" target="_blank">${eventUri}</a></p>
          <p>You have <b>${purchasedClass.remainingSessions}</b> sessions remaining.</p>
          <p>Best Regards,<br>Rockstar Math Tutoring</p>
      </div>
    `;

    await sendEmail(recipients, emailSubject, '', emailHtml);
    console.log(`✅ Booking confirmation email sent to ${recipients}`);

    res.status(200).json({ message: 'Booking stored successfully', updatedUser: user });
  } catch (error) {
    console.error('❌ Error handling Calendly webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Calendly Bookings
exports.getCalendlyBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Checking UserId:', userId);

    // Find user in MongoDB
    const user = await Register.findById(userId);

    console.log('✅ Retrieved user data:', JSON.stringify(user, null, 2));

    if (!user) {
      console.error('❌ User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Return bookedSessions from the user
    res.status(200).json({ bookings: user.bookedSessions || [] });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get recipient emails (billing and scheduling)
const getRecipientEmails = (user) => {
  let recipients = [user.billingEmail];

  if (user.schedulingEmails) {
    if (Array.isArray(user.schedulingEmails)) {
      recipients = recipients.concat(user.schedulingEmails);
    } else {
      recipients.push(user.schedulingEmails);
    }
  }

  // Remove null/undefined values and join into a comma-separated string
  return recipients.filter((email) => email).join(',');
};

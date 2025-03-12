const Register = require('../models/registerModel')
const sendEmail = require('../utils/emailSender')
const crypto = require('crypto');


// Webhook Signature Verification
const verifyWebhookSignature = (req, signingKey) => {
  const signature = req.headers['X-Cal-Signature']; // Incoming signature from Calendly
  const payload = JSON.stringify(req.body); // Body ko JSON mein convert karke stringify karna zaroori hai

  const computedSignature = crypto
    .createHmac('sha256', signingKey)  // HMAC sha256 signature calculate karna
    .update(payload)  // Payload ko update karte hue hash karna
    .digest('base64');  // Base64 encoded signature generate karna
  
  console.log("📢 Computed Signature:", computedSignature); // Debugging: Computed Signature ko print karo
  console.log("📢 Incoming Signature:", signature); // Debugging: Incoming Signature ko print karo
  
  return signature === computedSignature; // Compare karna incoming aur computed signature
};

exports.calendlyWebhook = async (req, res) => {
  try {

    const signingKey = process.env.CALENDLY_SIGNING_KEY; // Webhook Signing Key ko environment variable se load karna
    if (!verifyWebhookSignature(req, signingKey)) {
      console.error("❌ Invalid webhook signature"); // Signature mismatch hone par error
      return res.status(400).json({ error: 'Invalid signature' });
    }


    console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.payload) {
      console.error('❌ Invalid Webhook Payload:', req.body);
      return res.status(400).json({ error: 'Invalid Webhook Payload' });
    }

    const payload = req.body.payload;

    // ✅ Extract Invitee & Event Details
    const inviteeEmail = payload?.email || '❌ Missing';
    const eventName = payload?.name || payload?.event?.name || '❌ Missing';
    const eventUri = payload?.event?.uri || payload?.event?.invitee?.uri || payload?.scheduled_event?.uri || '❌ Missing';

    // ✅ Normalize URL for consistency
    const normalizeUrl = (url) => url?.split('?')[0].trim().toLowerCase();
    const normalizedEventUri = eventUri !== '❌ Missing' ? normalizeUrl(eventUri) : null;

    // ✅ Extract `startTime` and `endTime`
    const startTime =
      payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time
        ? new Date(
            payload?.start_time ||
              payload?.event?.start_time ||
              payload?.scheduled_event?.start_time
          )
        : null;

    const endTime =
      payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time
        ? new Date(
            payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time
          )
        : startTime
        ? new Date(startTime.getTime() + 30 * 60000) // Default to 30 min duration
        : null;

    const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing';

    // ✅ Validation: Ensure required fields are present
    if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Find user in MongoDB using invitee email (Match both billing & scheduling emails)
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

    // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
    const eventAlreadyExists = user.bookedSessions.some(
      (session) => session.calendlyEventUri === normalizedEventUri
    );
    
    if (eventAlreadyExists) {
      console.log(`⚠️ Duplicate Event Detected: ${eventName}. Skipping Booking.`);
      return res.status(200).json({ message: 'Event already stored, skipping' });
    }

    // ✅ Find Matching Purchased Class (Even if Expired)
    let purchasedClass = user.purchasedClasses.find((cls) => {
      return normalizeUrl(cls.bookingLink) === normalizedEventUri;
    });

    // ✅ If No Matching Class, Assign First Available One
    if (!purchasedClass) {
      console.warn(`⚠️ No valid purchased class found for user: ${inviteeEmail}`);

      if (user.purchasedClasses.length > 0) {
        purchasedClass = user.purchasedClasses.find((cls) => cls.status === "Active") || user.purchasedClasses[0];

        // ✅ If Class was Expired, Reactivate it
        purchasedClass.bookingLink = normalizedEventUri;
        purchasedClass.status = "Active";
        purchasedClass.remainingSessions = purchasedClass.sessionCount; // ✅ Reset Remaining Sessions

        user.markModified('purchasedClasses'); 
        await user.save();
        console.log(`🔄 Updated booking link & reactivated class for: ${normalizedEventUri}`);
      } else {
        return res.status(400).json({ error: "No valid purchased class for this booking." });
      }
    }

    // ✅ Ensure User Has Remaining Sessions
    if (purchasedClass.remainingSessions <= 0) {
      console.warn(`⚠️ User ${user.username} has no remaining sessions.`);
      return res.status(403).json({ error: "You have no remaining sessions left." });
    }

    // ✅ Deduct 1 Session
    purchasedClass.remainingSessions -= 1;
    user.markModified('purchasedClasses');

    if (purchasedClass.remainingSessions === 0) {
      purchasedClass.status = "Expired";
    }

    // ✅ Create New Booking Object
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

    // ✅ Update User's bookedSessions
    user.bookedSessions.push(newBooking);

    // ✅ Save User with the updated session and class data
    await user.save();

    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);
    console.log(`✅ Session Booked: Remaining ${purchasedClass.remainingSessions} sessions.`);

    // ✅ **Send Confirmation Email to Billing & Scheduling Emails**
    let recipients = [user.billingEmail];

    if (user.schedulingEmails) {
      if (Array.isArray(user.schedulingEmails)) {
        recipients = recipients.concat(user.schedulingEmails);
      } else {
        recipients.push(user.schedulingEmails);
      }
    }

    recipients = recipients.filter((email) => email); // Remove null/undefined values
    const recipientEmails = recipients.join(',');

    // ✅ Email Content
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

    await sendEmail(recipientEmails, emailSubject, '', emailHtml);
    console.log(`✅ Booking confirmation email sent to ${recipientEmails}`);

    res.status(200).json({ message: 'Booking stored successfully', updatedUser: user });
  } catch (error) {
    console.error('❌ Error handling Calendly webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getCalendlyBookings = async (req, res) => {
  try {
    const { userId } = req.params

    console.log('🔍 Checking UserId:', userId) // Debugging log

    // Find user in MongoDB
    const user = await Register.findById(userId)

    console.log('✅ Retrieved user data:', JSON.stringify(user, null, 2)) // Debugging log

    if (!user) {
      console.error('❌ User not found with ID:', userId)
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Return bookedSessions from the user
    res.status(200).json({ bookings: user.bookedSessions || [] })
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

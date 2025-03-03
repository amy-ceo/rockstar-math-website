const Register = require('../models/registerModel')
const sendEmail = require('../utils/emailSender')

exports.calendlyWebhook = async (req, res) => {
    try {
      console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));
  
      if (!req.body || !req.body.payload) {
        console.error('❌ Invalid Webhook Payload:', req.body);
        return res.status(400).json({ error: 'Invalid Webhook Payload' });
      }
  
      const payload = req.body.payload;
  
      // ✅ Extract Invitee & Event Details
      const inviteeEmail = payload?.email || '❌ Missing';
      const eventName = payload?.name || payload?.event?.name || '❌ Missing';
      const eventUri = payload?.uri || payload?.event?.uri || '❌ Missing';
  
      // ✅ Extract `startTime` and `endTime`
      const startTime = payload?.start_time
        ? new Date(payload.start_time)
        : null;
  
      const endTime = payload?.end_time
        ? new Date(payload.end_time)
        : startTime
          ? new Date(startTime.getTime() + 30 * 60000) // Default 30 min duration
          : null;
  
      const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing';
  
      // ✅ Validation: Ensure required fields are present
      if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
        console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // ✅ Find user in MongoDB using invitee email
      const user = await Register.findOne({ billingEmail: inviteeEmail });
  
      if (!user) {
        console.error('❌ No user found:', inviteeEmail);
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log('👤 User Found:', user);
  
      // ✅ Normalize URLs for comparison
      const normalizeUrl = (url) => url?.split('?')[0].trim().replace(/;$/, '').toLowerCase(); // ✅ Fix trailing semicolon issue
  
      const normalizedEventUri = normalizeUrl(eventUri);
      console.log('🔍 Normalized Event URI:', normalizedEventUri);
  
      console.log(`🛠 Debug: User ${user.username} has these booking links:`);
      user.purchasedClasses.forEach(cls => console.log(`🔗 Stored Booking Link: ${normalizeUrl(cls.bookingLink)}`));
  
      // ✅ Find Matching Purchased Class
      let purchasedClass = user.purchasedClasses.find(
        (cls) => normalizeUrl(cls.bookingLink) === normalizedEventUri
      );
  
      // ✅ If no match, update the first available class's booking link
      if (!purchasedClass) {
        console.warn(`⚠️ No valid purchased class found for user: ${inviteeEmail}`);
  
        if (user.purchasedClasses.length > 0) {
          // ✅ Update only the first available purchased class (DO NOT deduct session)
          user.purchasedClasses[0].bookingLink = normalizedEventUri;
          user.purchasedClasses[0].description =
            user.purchasedClasses[0].description || 'Calendly Booking';
          user.markModified('purchasedClasses'); // Ensure Mongoose detects the change
          await user.save();
          console.log(`🔄 Updated booking link to: ${normalizedEventUri}`);
  
          return res.status(200).json({ message: 'Booking link updated. Please rebook the session.' });
        } else {
          return res.status(400).json({ error: 'No valid purchased class for this booking.' });
        }
      }
  
      // ✅ Check if User Has Remaining Sessions
      if (purchasedClass.remainingSessions <= 0) {
        console.warn(`⚠️ User ${user.username} has no remaining sessions.`);
        return res.status(403).json({ error: 'You have no remaining sessions left.' });
      }
  
      // ✅ Ensure `bookedSessions` is an array before pushing
      if (!Array.isArray(user.bookedSessions)) {
        user.bookedSessions = [];
      }
  
      // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
      const eventAlreadyExists = user.bookedSessions.some(
        (session) => session.calendlyEventUri === eventUri
      );
  
      if (eventAlreadyExists) {
        console.log(`⚠️ Event Already Exists in User Bookings: ${eventName}`);
        return res.status(200).json({ message: 'Event already stored, skipping' });
      }
  
      // ✅ Deduct 1 Session (ONLY IF NOT ALREADY BOOKED)
      purchasedClass.remainingSessions -= 1;
      user.markModified('purchasedClasses'); // Ensure change is detected by Mongoose
  
      // ✅ If Remaining Sessions = 0, Mark as Expired & Send Notification
      if (purchasedClass.remainingSessions === 0) {
        purchasedClass.status = 'Expired';
  
        try {
          // ✅ Send an email notification
          await sendEmail(
            user.billingEmail,
            '🎟 Your Rockstar Math Sessions Have Expired!',
            'Hi, your purchased sessions have been used up. Please purchase more sessions to continue learning!',
            `<p>Your purchased sessions are finished. Click <a href="https://www.rockstarmath.com/services">here</a> to buy more!</p>`,
          );
          console.log(`📧 Expiry email sent to ${user.billingEmail}`);
        } catch (emailError) {
          console.error('❌ Error sending expiry email:', emailError);
        }
      }
  
      // ✅ Create New Booking Object
      const newBooking = {
        eventName,
        calendlyEventUri: eventUri,
        startTime,
        endTime,
        timezone,
        status: "Booked",
        createdAt: new Date(),
      };
  
      console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2));
  
      // ✅ Push New Booking into `bookedSessions`
      user.bookedSessions.push(newBooking);
  
      // ✅ Debug Logs Before Saving
      console.log("🔄 Saving User Booking Data...", JSON.stringify(user.bookedSessions, null, 2));
  
      // ✅ Force Mongoose to Detect Changes
      user.markModified("bookedSessions");
  
      // ✅ Save Updated User Data
      await user.save();
      console.log("✅ Booking Successfully Saved!");
  
      console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);
      console.log(`✅ Session Booked: Remaining ${purchasedClass.remainingSessions} sessions.`);
  
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

const Register = require("../models/registerModel");

exports.zoomWebhook = async (req, res) => {
  try {
      console.log("📢 FULL Zoom Webhook Payload:", JSON.stringify(req.body, null, 2));

      // ✅ 1. Handle Empty Payload Case
      if (!req.body || Object.keys(req.body).length === 0) {
          console.error("❌ Received an empty webhook payload!");
          return res.status(400).json({ error: "Invalid Webhook Payload - Empty request" });
      }

      // ✅ 2. Handle Zoom URL Validation Request
      if (req.body.event === "endpoint.url_validation") {
          console.log("✅ Zoom URL Validation Request Received!", req.body);
          
          if (req.body.payload && req.body.payload.plainToken) {
              return res.json({ plainToken: req.body.payload.plainToken });
          }

          console.error("❌ Missing plainToken in Zoom validation request:", req.body);
          return res.status(400).json({ error: "Missing plainToken for validation" });
      }

      // ✅ 3. Validate Incoming Zoom Webhook Payload
      if (!req.body.payload || !req.body.payload.object) {
          console.error("❌ Invalid Webhook Payload:", req.body);
          return res.status(400).json({ error: "Invalid Webhook Payload - Missing required fields" });
      }

      const payload = req.body.payload.object;
      const registrant = payload.registrant || {};
      const inviteeEmail = registrant.email || "❌ Missing";
      const meetingTopic = payload.topic || "❌ Missing";
      const meetingId = payload.id || "❌ Missing";
      const joinUrl = registrant.join_url || "❌ Missing";

      const startTime = payload.start_time ? new Date(payload.start_time) : null;
      if (inviteeEmail === "❌ Missing" || !startTime) {
          console.error("❌ Missing required data:", { inviteeEmail, startTime });
          return res.status(400).json({ error: "Missing required fields" });
      }

      // ✅ Find user in MongoDB
      const user = await Register.findOne({ billingEmail: inviteeEmail }).exec();
      if (!user) {
          console.error("❌ No user found with email:", inviteeEmail);
          return res.status(404).json({ error: "User not found" });
      }

      // ✅ Check if Zoom Event Already Exists
      const eventAlreadyExists = user.zoomBookings.some(
          (booking) => booking.zoomMeetingId === meetingId
      );
      if (eventAlreadyExists) {
          console.log(`⚠️ Duplicate Zoom Event Detected: ${meetingTopic}. Skipping Booking.`);
          return res.status(200).json({ message: "Event already stored, skipping" });
      }

      // ✅ Deduct 1 Session from Purchased Class
      let purchasedClass = user.purchasedClasses.find((cls) => cls.remainingSessions > 0);
      if (!purchasedClass) {
          return res.status(400).json({ error: "No valid purchased class for this booking." });
      }

      purchasedClass.remainingSessions -= 1;
      if (purchasedClass.remainingSessions === 0) {
          purchasedClass.status = "Expired";
      }

      // ✅ Store Zoom Booking Separately
      const newZoomBooking = {
          eventName: meetingTopic,
          firstName: registrant.first_name || "N/A",
          lastName: registrant.last_name || "N/A",
          zoomMeetingId: meetingId,
          zoomMeetingLink: joinUrl,
          startTime,
          endTime: new Date(startTime.getTime() + (payload.duration || 30) * 60000),
          timezone: "UTC",
          status: "Booked",
      };

      user.zoomBookings.push(newZoomBooking);
      await user.save();

      console.log(`✅ Successfully Stored Zoom Booking for ${inviteeEmail}`);
      res.status(200).json({ message: "Zoom Booking stored successfully", updatedUser: user });

  } catch (error) {
      console.error("❌ Error handling Zoom webhook:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};

  

exports.getUserZoomBookings = async (req, res) => {
    try {
      const { email } = req.query;
  
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
  
      // 🔎 Find User by Email (Case-Insensitive)
      const user = await Register.findOne({ billingEmail: new RegExp(`^${email}$`, "i") }).exec();
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // 📢 Send Back Zoom Bookings
      res.status(200).json({
        message: "Zoom bookings fetched successfully",
        zoomBookings: user.zoomBookings || [],
      });
    } catch (error) {
      console.error("❌ Error fetching Zoom bookings:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
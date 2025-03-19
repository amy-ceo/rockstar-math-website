    const express = require('express');
    const { zoomWebhook, getUserZoomBookings , cancelZoomSession, } = require('../controller/zoomController');
    const UsedZoomLink = require('../models/UsedZoomLink');
    const router = express.Router();

    // ✅ Zoom Webhook Route
    router.post('/webhook', zoomWebhook);
    router.get("/bookings/:userId", getUserZoomBookings);
    router.post("/cancel-session", cancelZoomSession); // ✅ Add Cancel Route
    // Route to validate and redirect Zoom links
router.get('/zoom-access', async (req, res) => {
    const { token, userId, zoomLink } = req.query;
  
    if (!token || !userId || !zoomLink) {
      return res.status(400).send('Invalid request');
    }
  
    try {
      // ✅ Check if link is already used
      const alreadyUsed = await UsedZoomLink.findOne({ userId, zoomLink });
  
      if (alreadyUsed) {
        return res.status(403).send('This Zoom link has already been used.');
      }
  
      // ✅ Mark the link as used
      await new UsedZoomLink({ userId, zoomLink }).save();
  
      // ✅ Redirect user to Zoom meeting
      res.redirect(zoomLink);
    } catch (error) {
      console.error('Error validating Zoom link:', error);
      res.status(500).send('Server error');
    }
  });
  

    module.exports = router;
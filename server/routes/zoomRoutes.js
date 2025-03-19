    const express = require('express');
    const { zoomWebhook, getUserZoomBookings , cancelZoomSession, } = require('../controller/zoomController');

    const router = express.Router();

    // ✅ Zoom Webhook Route
    router.post('/webhook', zoomWebhook);
    router.get("/bookings/:userId", getUserZoomBookings);
    router.post("/cancel-session", cancelZoomSession); // ✅ Add Cancel Route

    module.exports = router;
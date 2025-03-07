const express = require('express');
const { zoomWebhook, getUserZoomBookings } = require('../controller/zoomController');

const router = express.Router();

// ✅ Zoom Webhook Route
router.post('/webhook', zoomWebhook);
router.get("/bookings", getUserZoomBookings);

module.exports = router;
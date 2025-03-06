const express = require("express");
const { 
  calendlyWebhook, 
  getCalendlyBookings,
  zoomWebhook, // ✅ Add Zoom Webhook Controller
  getZoomBookings // ✅ Add API to Fetch Zoom Bookings
} = require("../controller/webhookController");

const router = express.Router();

// ✅ Calendly Webhook Routes
router.post("/calendly", calendlyWebhook);
router.get("/:userId/calendly-bookings", getCalendlyBookings);

// ✅ Zoom Webhook Routes (New)
router.post("/zoom", zoomWebhook); // ✅ Store Zoom Registrations
router.get("/:userId/zoom-bookings", getZoomBookings); // ✅ Fetch User's Zoom Sessions

module.exports = router;

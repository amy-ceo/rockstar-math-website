const express = require("express");
const { 
  calendlyWebhook, 
  getCalendlyBookings,

} = require("../controller/webhookController");

const router = express.Router();

// ✅ Calendly Webhook Routes
router.post("/", calendlyWebhook);
router.get("/:userId/calendly-bookings", getCalendlyBookings);



module.exports = router;

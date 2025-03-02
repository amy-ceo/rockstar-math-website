const express = require("express");
const { calendlyWebhook,getCalendlyBookings, } = require("../controller/webhookController");
const router = express.Router();

router.post("/calendly", calendlyWebhook);
router.get('/:userId/calendly-bookings', getCalendlyBookings);


module.exports = router;

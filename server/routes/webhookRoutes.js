const express = require("express");
const { calendlyWebhook,getCalendlyBookings,cancelSession } = require("../controller/webhookController");
const router = express.Router();

router.post("/calendly", calendlyWebhook);
router.get('/:userId/calendly-bookings', getCalendlyBookings);
router.post('/cancel-booking', cancelSession);


module.exports = router;

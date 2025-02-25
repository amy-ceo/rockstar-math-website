const express = require("express");
const { createOrder, captureOrder,paypalWebhook } = require("../controller/paypalController"); // ✅ Fix the path

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/capture-order", captureOrder);
router.post("/webhook", paypalWebhook);

module.exports = router;
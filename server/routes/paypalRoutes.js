const express = require("express");
const { createOrder, captureOrder } = require("../controller/paypalController"); // ✅ Fix the path

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/capture-order", captureOrder);

module.exports = router;
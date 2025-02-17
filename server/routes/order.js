const express = require("express");
const router = express.Router();
const Order = require("../models/OrderModel");

// ✅ Fetch Only Paid Orders for User
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        // ✅ Fetch only "Paid" orders for the user
        const paidOrders = await Order.find({ userId, status: "Paid" });
        res.status(200).json(paidOrders);
    } catch (error) {
        console.error("❌ Error fetching orders:", error.message);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

module.exports = router;

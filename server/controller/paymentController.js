const Payment = require("../models/PaymentModel");

const updatePaymentStatus = async (paymentIntentId, status) => {
    try {
        const payment = await Payment.findOneAndUpdate(
            { paymentIntentId: paymentIntentId },
            { status: status },
            { new: true, upsert: true } // ✅ Upsert: If not found, create new entry
        );

        console.log(`✅ Payment Status Updated: ${paymentIntentId} → ${status}`);
        return payment;
    } catch (error) {
        console.error("❌ Error Updating Payment Status:", error.message);
        throw new Error("Database update failed.");
    }
};

module.exports = { updatePaymentStatus };

const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const sendEmail = require("../utils/emailSender");

// PayPal Client Setup
const paypalClient = require("../config/paypal");

// 🎯 Create PayPal Order
exports.createOrder = async (req, res) => {
    try {
        const { userId, amount, cartItems } = req.body;

        if (!userId || !amount || !cartItems || amount <= 0) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        // ✅ Create Order Request
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: amount.toFixed(2).toString(),
                    },
                    description: "E-commerce Payment",
                    items: cartItems.map((item) => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "USD",
                            value: item.price.toFixed(2).toString(),
                        },
                        quantity: item.quantity.toString(),
                    })),
                },
            ],
            application_context: {
                return_url: "https://frontend-production-90a4.up.railway.app/success",
                cancel_url: "https://frontend-production-90a4.up.railway.app/cancel",
            },
        });

        // ✅ Create Order in PayPal
        const order = await paypalClient.execute(request);
        res.json({ orderId: order.result.id });
    } catch (error) {
        console.error("❌ Error Creating PayPal Order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 🎯 Capture PayPal Order & Send Email
exports.captureOrder = async (req, res) => {
    try {
        const { orderId, user } = req.body;

        if (!orderId || !user || !user.billingEmail) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Capture PayPal Payment
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
        captureRequest.requestBody({});
        const captureResponse = await paypalClient.execute(captureRequest);

        const capturedPayment = captureResponse.result;
        const amount = capturedPayment.purchase_units[0].payments.captures[0].amount.value;
        const currency = capturedPayment.purchase_units[0].payments.captures[0].amount.currency_code;

        // ✅ Save Payment to Database
        const newPayment = new Payment({
            orderId,
            userId: user._id,
            billingEmail: user.billingEmail,
            amount,
            currency,
            status: "Completed",
            paymentMethod: "PayPal",
            cartItems: user.cartItems, // Store the purchased products
        });

        await newPayment.save();

        // ✅ Send Confirmation Email
        const subject = "Order Confirmation - Your Purchase is Successful!";
        const text = `Hello ${user.username},\n\nThank you for your purchase! Here are your order details:\n
        - Order ID: ${orderId}
        - Amount: $${amount} ${currency}
        - Purchased Items: ${user.cartItems.map(item => item.name).join(", ")}
        \n\nBest regards,\nYour Store Team`;

        const html = `
            <h3>Thank You, ${user.username}!</h3>
            <p>Your payment of <strong>$${amount} ${currency}</strong> was successful.</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Purchased Items:</strong></p>
            <ul>
                ${user.cartItems.map(item => `<li>${item.name} (x${item.quantity}) - $${item.price}</li>`).join("")}
            </ul>
            <p>We appreciate your business!</p>
        `;

        await sendEmail(user.billingEmail, subject, text, html);

        res.json({ message: "Payment captured & email sent successfully", payment: capturedPayment });
    } catch (error) {
        console.error("❌ Error Capturing PayPal Payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
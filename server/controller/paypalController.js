const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const sendEmail = require("../utils/emailSender");

// PayPal Client Setup
const paypalClient = require("../config/paypal");

// 🎯 Create PayPal Order
exports.createOrder = async (req, res) => {
    try {
        let { userId, amount, cartItems } = req.body;

        // ✅ Ensure amount is a valid number
        amount = parseFloat(amount);
        if (!userId || isNaN(amount) || !cartItems || cartItems.length === 0 || amount <= 0) {
            console.error("❌ Invalid Request Data:", { userId, amount, cartItems });
            return res.status(400).json({ error: "Invalid request data" });
        }

        console.log("🛒 Received Order Request:", { userId, amount, cartItems });

        // ✅ Prepare PayPal Order Request
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: amount.toFixed(2), // ✅ Ensure it is a string
                        breakdown: {
                            item_total: { currency_code: "USD", value: amount.toFixed(2) } // ✅ Fix required
                        },
                    },
                    description: "E-commerce Payment",
                    items: cartItems.map((item) => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "USD",
                            value: Number(item.price).toFixed(2), // ✅ Fix: Convert price to number
                        },
                        quantity: item.quantity ? Number(item.quantity).toString() : "1", // ✅ Ensure quantity is string
                        category: "DIGITAL_GOODS",
                    })),
                },
            ],
            application_context: {
                brand_name: "Rockstar Math",
                locale: "en-US",
                user_action: "PAY_NOW",
                return_url: "https://your-frontend.com/success",
                cancel_url: "https://your-frontend.com/cancel",
            },
        });

        // ✅ Execute PayPal Order
        const order = await paypalClient.execute(request);
        console.log("✅ PayPal Order Response:", order.result);

        if (!order.result || !order.result.id) {
            console.error("❌ PayPal Order Creation Failed - No ID Returned");
            return res.status(500).json({ error: "PayPal order creation failed" });
        }

        res.json({ orderId: order.result.id });

    } catch (error) {
        console.error("❌ PayPal Order Error:", error.message || error);
        res.status(500).json({ error: "Internal Server Error", details: error.message || error });
    }
};


// 🎯 Capture PayPal Order & Send Email
// 🎯 Capture PayPal Order & Update Purchase
exports.captureOrder = async (req, res) => {
    try {
        const { orderId, user } = req.body;

        if (!orderId || !user || !user._id || !user.billingEmail || !user.cartItems) {
            console.error("❌ Missing required fields:", { orderId, user });
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("🛒 Capturing PayPal Order:", orderId);

        // ✅ Capture PayPal Payment
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
        captureRequest.requestBody({});
        const captureResponse = await paypalClient.execute(captureRequest);

        console.log("✅ Capture Response:", captureResponse.result);

        // ✅ Check if payment was actually completed
        if (!captureResponse.result || captureResponse.result.status !== "COMPLETED") {
            console.error("❌ PayPal Capture Failed - Status:", captureResponse.result.status);
            return res.status(400).json({ error: "Payment capture failed", details: captureResponse.result });
        }

        const capturedPayment = captureResponse.result;
        const amount = capturedPayment.purchase_units[0].payments.captures[0].amount.value;
        const currency = capturedPayment.purchase_units[0].payments.captures[0].amount.currency_code;

        // ✅ Find and Update the User in the Database
        const existingUser = await Register.findById(user._id);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log("✅ Existing User Found:", existingUser);

        // ✅ Format Purchased Classes
        const newPurchases = user.cartItems.map(item => ({
            name: item.name,
            description: item.description || "No description available",
            purchaseDate: new Date(),
            sessionCount: 0,
            remainingSessions: 0,
            bookingLink: null,
        }));

        // ✅ Append New Purchases to Existing `purchasedClasses` Array
        existingUser.purchasedClasses = [...existingUser.purchasedClasses, ...newPurchases];

        // ✅ Save the Updated User Document
        await existingUser.save();
        console.log("✅ User's Purchased Classes Updated");

        // ✅ Save Payment Details to Database
        const newPayment = new Payment({
            orderId,
            userId: user._id,
            billingEmail: user.billingEmail,
            amount,
            currency,
            status: "Completed",
            paymentMethod: "PayPal",
            cartItems: user.cartItems,
        });

        await newPayment.save();
        console.log("✅ Payment Record Saved");

        // ✅ Send Confirmation Email
        const subject = "Order Confirmation - Your Purchase is Successful!";
        const text = `Hello ${user.username},\n\nThank you for your purchase! Here are your order details:\n
        - Order ID: ${orderId}
        - Amount: $${amount} ${currency}
        - Purchased Items: ${user.cartItems.map(item => item.name).join(", ")}
        \n\nYour purchased classes have been added to your account.\nBest regards,\nYour Store Team`;

        const html = `
            <h3>Thank You, ${user.username}!</h3>
            <p>Your payment of <strong>$${amount} ${currency}</strong> was successful.</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Purchased Items:</strong></p>
            <ul>
                ${user.cartItems.map(item => `<li>${item.name} (x${item.quantity}) - $${item.price}</li>`).join("")}
            </ul>
            <p>Your purchased classes have been added to your account.</p>
        `;

        await sendEmail(user.billingEmail, subject, text, html);
        console.log("✅ Confirmation Email Sent");

        res.json({ message: "Payment captured, purchased classes updated & email sent successfully", payment: capturedPayment });

    } catch (error) {
        console.error("❌ Error Capturing PayPal Payment:", error);

        // Send a response back to the frontend
        res.status(500).json({ error: "Internal Server Error", details: error.message || error });
    }
};

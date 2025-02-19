const paypal = require("../config/paypal");
const Payment = require("../models/Payment");
const sendEmail = require("../utils/emailSender");

exports.createOrder = async (req, res) => {
    try {
        const { userId, amount, cartItems } = req.body;

        if (!userId || !amount || !cartItems || amount <= 0) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const create_payment_json = {
            intent: "CAPTURE",
            payer: {
                payment_method: "paypal",
            },
            transactions: [
                {
                    amount: {
                        total: amount.toFixed(2),
                        currency: "USD",
                    },
                    description: "E-commerce Payment",
                    item_list: {
                        items: cartItems.map(item => ({
                            name: item.name,
                            price: item.price.toFixed(2),
                            currency: "USD",
                            quantity: item.quantity,
                        })),
                    },
                },
            ],
            redirect_urls: {
                return_url: "https://frontend-production-90a4.up.railway.app/success",
                cancel_url: "https://frontend-production-90a4.up.railway.app/cancel",
            },
        };

        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error("❌ PayPal Order Creation Error:", error.response);
                return res.status(500).json({ error: "PayPal order creation failed" });
            }

            if (!payment || !payment.id) {
                return res.status(500).json({ error: "Failed to generate order ID" });
            }

            res.json({ orderId: payment.id });
        });
    } catch (error) {
        console.error("❌ Error Creating PayPal Order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// 🎯 Capture PayPal Payment & Send Email
exports.captureOrder = async (req, res) => {
    try {
        const { orderId, userId, billingEmail, cartItems } = req.body;

        if (!orderId || !userId || !billingEmail || !cartItems) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        paypal.payment.get(orderId, async (error, payment) => {
            if (error) {
                console.error("❌ Error Fetching PayPal Order:", error);
                return res.status(500).json({ error: "Error fetching PayPal order" });
            }

            if (payment.state !== "approved") {
                return res.status(400).json({ error: "Payment not approved yet" });
            }

            // ✅ Save Payment to Database
            const newPayment = new Payment({
                orderId,
                userId,
                billingEmail,
                amount: payment.transactions[0].amount.total,
                currency: payment.transactions[0].amount.currency,
                status: "Completed",
                paymentMethod: "PayPal",
                cartItems,
            });

            await newPayment.save();

            // ✅ Send Confirmation Email
            await sendEmail(
                billingEmail,
                "Payment Confirmation - Your Order is Successful",
                `Thank you for your purchase! Your order ID is ${orderId}.`,
                `<h3>Thank You for Your Payment</h3>
                <p>Your payment of $${payment.transactions[0].amount.total} USD was successful.</p>
                <p>Order ID: <strong>${orderId}</strong></p>`
            );

            res.json({ message: "Payment saved & email sent successfully", payment });
        });
    } catch (error) {
        console.error("❌ Error Capturing PayPal Payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

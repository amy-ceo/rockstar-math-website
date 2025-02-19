import React from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";

const PayPalButton = ({ totalAmount, cartItems }) => {
    // ✅ Fetch API Base URL from Environment Variables
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://backend-production-4b2c.up.railway.app";

    const handleCreateOrder = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user || !user._id || !user.billingEmail) {
                toast.error("User not logged in or missing details!");
                throw new Error("User ID or email missing in localStorage");
            }

            if (!cartItems || cartItems.length === 0) {
                toast.error("Your cart is empty. Add items before proceeding.");
                return null;
            }

            console.log("🔹 Creating PayPal Order...");

            const response = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    userId: user._id, 
                    amount: parseFloat(totalAmount), 
                    cartItems 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("❌ PayPal Order Creation Failed:", data.error);
                toast.error(data.error || "Failed to create PayPal order");
                return null;
            }

            if (!data || !data.orderId) {
                console.error("❌ Missing Order ID in response:", data);
                toast.error("Invalid order response from server.");
                return null;
            }

            console.log("✅ PayPal Order Created:", data.orderId);
            return data.orderId;

        } catch (error) {
            console.error("❌ Error creating PayPal order:", error);
            toast.error(error.message || "Error creating PayPal order.");
            return null;
        }
    };

    const handleApprove = async (data, actions) => {
        try {
            const orderDetails = await actions.order.capture();

            if (!orderDetails || !orderDetails.id) {
                throw new Error("Invalid payment details received from PayPal");
            }

            toast.success("Payment Successful! Saving to database...");

            const user = JSON.parse(localStorage.getItem("user"));

            if (!user || !user.billingEmail) {
                toast.error("User email not found!");
                return;
            }

            console.log("✅ PayPal Payment Captured:", orderDetails);

            // ✅ Send Payment Data to Backend
            const response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderDetails.id,
                    user: {
                        _id: user._id,
                        username: user.username,
                        billingEmail: user.billingEmail,
                        phone: user.phone,
                        cartItems,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Payment not saved in database");
            }

            const result = await response.json();
            console.log("✅ Payment Saved Successfully:", result);
            toast.success("Payment saved successfully!");

        } catch (error) {
            console.error("❌ Error saving payment:", error);
            toast.error(error.message || "Error saving payment details.");
        }
    };

    return (
        <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "pill", label: "paypal" }}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
        />
    );
};

export default PayPalButton;

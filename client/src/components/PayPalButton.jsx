import React from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";

const PayPalButton = ({ totalAmount, cartItems }) => {
    const handleCreateOrder = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user || !user._id) {
                toast.error("User not logged in!");
                throw new Error("User ID missing in localStorage");
            }

            if (!cartItems || cartItems.length === 0) {
                toast.error("Cart is empty. Add items before proceeding.");
                return null;
            }

            console.log("🔹 Creating PayPal Order...");

            const response = await fetch("https://rockstarmathfinal-production.up.railway.app/api/paypal/create-order", {
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

    const handleApprove = (data, actions) => {
        return actions.order.capture().then(async (details) => {
            try {
                toast.success("Payment Successful! Saving to database...");

                const user = JSON.parse(localStorage.getItem("user"));
                if (!user || !user.email) {
                    toast.error("User email not found!");
                    return;
                }

                console.log("✅ PayPal Payment Captured:", details);

                // ✅ Send Payment Data to Backend
                const response = await fetch("https://rockstarmathfinal-production.up.railway.app/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: details.id,
                        userId: user._id,
                        userEmail: user.email,
                        cartItems,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Payment not saved in database");
                }

                const result = await response.json();
                console.log("✅ Payment Saved Successfully", result);
                toast.success("Payment saved successfully!");

            } catch (error) {
                console.error("❌ Error saving payment:", error);
                toast.error("Error saving payment details.");
            }
        }).catch(error => {
            console.error("❌ PayPal Capture Error:", error);
            toast.error("Failed to capture PayPal payment.");
        });
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

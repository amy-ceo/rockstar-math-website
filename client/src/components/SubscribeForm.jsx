import React, { useState } from "react";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";

function SubscribeForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(""); // State for error messages

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(""); // Clear success message
        setError("");   // Clear error message

        try {
            const response = await axiosInstance.post("/subscribe", { email });
            if (response.data.success) {
                setMessage(response.data.message); // Show success message
                setEmail(""); // Clear the email input field
            } 
        } catch (error) {
            if (error.response && error.response.data.message) {
                setError(error.response.data.message); // Show error message from the backend
            } else {
                setError("An error occurred. Please try again."); // Fallback error message
            }
        }
    };

    return (
        <div className="p-6 max-w-sm mx-auto ">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Group tutoring
        </h2>
        <p className="text-gray-600 mb-4">
        Make your commitment to success today and get access to videos, study groups and discounts.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-deepBlue"
                required
            />
            <button
                type="submit"
                className="bg-deepBlue text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-all duration-300"
            >
                Subscribe
            </button>
        </form>
        {message && <p className="text-green-500 mt-4">{message}</p>} {/* Success message */}
        {error && <p className="text-red-500 mt-4">{error}</p>} {/* Error message */}
    </div>
    );
}

export default SubscribeForm;

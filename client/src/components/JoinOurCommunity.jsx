import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

function JoinOurCommunity() {
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
        <div className="container mx-auto px-4 py-10 bg-gray-50 rounded-lg shadow-lg">
    <div className="grid grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* First Div with Image */}
        <div className="col-span-12 lg:col-span-4 flex lg:justify-center">
            <img
                src="/images/classroom.png"
                alt="Join Our Learning Community"
                className="w-full max-w-xs sm:max-w-sm object-cover h-auto rounded-2xl border-4 border-deepBlue"
            />
        </div>

        {/* Second Div with Text and Form */}
        <div className="col-span-12 lg:col-span-8 flex flex-col mt-5">
            <h2 className="text-2xl lg:text-4xl font-bold leading-tight text-gray-800 text-left">
            Join a Tutoring Group
            </h2>
            <p className="mt-5 text-gray-600 text-left">
            Stay on top of math class by meeting with a high quality tutor on a weekly basis.  Do what the top students are doing and get support and stay on your path! 
            </p>

            {/* Subheading */}
            <h3 className="mt-6 text-xl font-semibold text-gray-800 text-left">
                Why Subscribe?
            </h3>

            {/* Bullet Points */}
            <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2 text-start">
                <li>Accountability. You have a team on your side</li>
                <li>Confidence: Ask all the questions you need to</li>
                <li>Support: Access to discounted private sessions</li>
            </ul>

            {/* Input Field and Button */}
            <div className="mt-6">
                <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-800 mb-2 text-start">
                    Ready to Learn?
                </label>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <input
                         type="email"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                        className="border border-deepBlue w-full max-w-md px-4 py-2 rounded-full text-gray-700 focus:ring-2 focus:ring-dborder-deepBlue focus:outline-none"
                        placeholder="Enter your email"
                    />
                    <button type="submit" className="bg-deepBlue border-deepBlue text-white px-6 py-2 rounded-full hover:bg-sky-600 transition-all duration-300 text-sm w-full sm:w-auto">
                    Sign-Up today
                    </button>
                    </form>
                    {message && <p className="text-green-500 mt-4">{message}</p>} {/* Success message */}
                    {error && <p className="text-red-500 mt-4">{error}</p>} {/* Error message */}
                </div>
            </div>
        </div>
</div>

    );
}

export default JoinOurCommunity;

import React, { useState } from 'react'
import axiosInstance from '../utils/axiosInstance'

const Newsletter = ({ onClose }) => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('') // State for error messages
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
  
    try {
      const response = await axiosInstance.post('/subscribe', { email });
      
      console.log("Response Data:", response.data); // ✅ Check response

      if (response.data.success) {
        setMessage(response.data.message || "Subscription successful! ✅"); // ✅ Default success message
        setEmail('');

        // ✅ Allow user to see success message for 1 second, then close modal
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError("Subscription failed. Please try again."); // ✅ Handle unexpected response
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "An error occurred. Please try again.");
    }
};


  return (
    <div className="flex items-center justify-center  py-40">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-5xl md:flex md:flex-row flex-col relative">
      

        {/* ✅ Left Side: Newsletter Image */}
        <div className="md:w-1/2 w-full bg-gray-100 rounded-t-lg md:rounded-l-lg overflow-hidden flex justify-center">
          <img
            src="/images/about3.png"
            alt="Newsletter"
            className="w-full h-auto object-cover md:max-h-80"
          />
        </div>

        {/* ✅ Right Side: Form */}
        <div className="md:w-1/2 w-full px-6 py-4 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">
            Subscribe to our <br />
            <span className="text-deepBlue">Newsletter!</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2">Stay updated with our latest news & offers.</p>
          {/* ✅ Form */}
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border w-full border-gray-300 rounded-md focus:ring-2 focus:ring-deepBlue outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-deepBlue text-white px-6 py-3 mt-4 rounded-md hover:bg-sky-600 transition-all duration-300"
            >
              Subscribe
            </button>
          </form>
          {message && <p className="text-green-500 mt-4">{message}</p>} {/* Success message */}
          {error && <p className="text-red-500 mt-4">{error}</p>} {/* Error message */}
        </div>
      </div>
    </div>
  )
}

export default Newsletter

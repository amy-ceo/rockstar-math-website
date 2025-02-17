import React from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../utils/axiosInstance';
function ContactForm() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        message: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Form validation
        if (!formData.fullName || !formData.email || !formData.message) {
            toast.error('Please fill in all required fields!');
            return;
        }

        try {
            const response = await axiosInstance.post('/contact/submit', formData);
            toast.success(response.data.message || 'Form submitted successfully!');
            setFormData({ fullName: '', email: '', phoneNumber: '', message: '' }); // Reset form
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting form. Please try again.');
        }
    };

  return (
    <>
      {/* Split Section */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto p-8 gap-6 items-center bg-gray-50">
        {/* Image Section */}
        <div className="lg:w-1/2 flex justify-center relative">
          
          <img
            src="/images/girlImage.png"
            alt="Sample"
            className="w-full max-w-[500px] h-auto rounded-lg relative z-10"
          />
        </div>

        {/* Contact Form Section */}
        <form onSubmit={handleSubmit} className="lg:w-1/2 flex flex-col p-8 bg-white shadow-md rounded-lg">
          <h2 className="text-4xl font-bold text-deepBlue mb-6">Let’s Collaborate Now!</h2>

          {/* Full Name Input */}
          <label htmlFor="fullName" className="text-gray-600 text-sm mb-2">
            Full Name
          </label>
          <input
           name="fullName"
           placeholder="Enter your full name"
           value={formData.fullName}
           onChange={handleChange}
           required
            className="w-full rounded-full border border-gray-300 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deetext-deepBlue mb-4"
          />

          {/* Email Input */}
          <label htmlFor="email" className="text-gray-600 text-sm mb-2">
            Email
          </label>
          <input
             name="email"
             type="email"
             placeholder="Enter your email"
             value={formData.email}
             onChange={handleChange}
             required
            className="w-full rounded-full border border-gray-300 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deetext-deepBlue mb-4"
          />

          {/* Phone Number Input */}
          <label htmlFor="phoneNumber" className="text-gray-600 text-sm mb-2">
            Phone Number
          </label>
          <input
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full rounded-full border border-gray-300 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deetext-deepBlue mb-4"
          />

          {/* Message Textarea */}
          <label htmlFor="message" className="text-gray-600 text-sm mb-2">
            Message
          </label>
          <textarea
           name="message"
           placeholder="Enter your message"
           value={formData.message}
           onChange={handleChange}
           required
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deetext-deepBlue mb-4"
            rows="4"
          ></textarea>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-deepBlue text-deepBlue hover:bg-sky-600 text-white py-2 px-4 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-deetext-deepBlue focus:ring-offset-2 transition-all duration-300"
          >
            Submit
          </button>
        </form>
      </div>
    </>
  )
}

export default ContactForm

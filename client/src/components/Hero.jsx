import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import 'animate.css';

function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [phonenumber, setPhonenumber] = useState('')
  const [currentgrade, setCurrentgrade] = useState('')

  // ✅ Function to send email to admin
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post('http://localhost:5000/api/consultation/request', {
        email,
        firstname,
        lastname,
        phonenumber,
        currentgrade,
      })

      if (response.data.success) {
        toast.success('Your request has been sent! Admin will contact you soon.')
        setIsModalOpen(false)
        setEmail('')
        setFirstname('')
        setLastname('')
        setPhonenumber('')
        setCurrentgrade('')
      } else {
        toast.error('Failed to send request. Try again.')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Something went wrong.')
    }
  }

  return (
    <>
      {/* ✅ Toast Container */}
      <Toaster position="top-right" />

      <div className="flex flex-col lg:flex-row items-center md:px-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 w-full py-20 pt-32 overflow-x-hidden relative">
        {/* Text Section */}
        <div className="flex flex-col text-center lg:text-left lg:w-1/2 space-y-6 animate__animated animate__fadeInRight">
          <span className="font-bold text-yellow-300 text-lg tracking-wide uppercase">
            Start to Success
          </span>
          <h1 className="capitalize text-[30px] md:text-[44px] xl:text-[52px] leading-tight font-extrabold text-white">
            Achieve your dreams <br />
            <span className="text-yellow-300">by starting on the right</span> path and learning
            <span className="text-yellow-300"> the right math! </span>
          </h1>
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            What math do you really need? What is keeping students from reaching their dreams? Often
            the answer is math class. Plan your journey, build a strong foundation, build
            confidence, and skate thru!
          </p>

          {/* Buttons */}
          <div className="flex items-center md:items-baseline gap-4 justify-center lg:justify-start">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 border border-yellow-300 text-yellow-300 font-semibold rounded-full transition duration-300 ease-in-out hover:bg-yellow-300 hover:text-indigo-600"
            >
              Free Consultation
            </button>
            <Link
              to="/services"
              className="px-8 py-3 bg-yellow-300 text-indigo-600 font-semibold rounded-full transition duration-300 ease-in-out hover:bg-transparent hover:text-yellow-300 hover:border-yellow-300 border border-transparent"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Image Section */}
        <div className="flex justify-center lg:justify-end mt-10 lg:mt-0 lg:w-1/2 relative">
          <div className="relative w-[300px] md:w-[400px] xl:w-[500px]">
            <img src="/images/hero.png" alt="girl with book" className="w-full z-10 animate__bounceIn" />
          </div>
        </div>
      </div>

      {/* ✅ Consultation Popup Form */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 mt-14 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate__animated animate__fadeInRight">
            <h2 className="text-xl font-bold text-gray-800">Request a Free Consultation</h2>
            <p className="text-gray-600 text-sm mt-2">
              Enter your email and we’ll contact you soon.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 ">
              <input
                type="text"
                placeholder="Enter your First Name"
                required
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepBlue"
              />
              <input
                type="text"
                placeholder="Enter your Last Name"
                required
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepBlue"
              />
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepBlue"
              />
              <input
                type="text"
                placeholder="Enter your Phone Number"
                required
                value={phonenumber}
                onChange={(e) => setPhonenumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepBlue"
              />
              <input
                type="number"
                placeholder="Enter your Current Grade"
                required
                value={currentgrade}
                onChange={(e) => setCurrentgrade(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepBlue"
              />
            
              <button
                type="submit"
                className="w-full bg-deepBlue text-white py-2 mt-4 rounded-lg hover:bg-sky-600"
              >
                Submit
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-2 text-gray-600 underline text-sm"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Hero

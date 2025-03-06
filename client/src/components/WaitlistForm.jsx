import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const WaitlistForm = ({ setIsFormModalOpen }) => {
  const [email, setEmail] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [phonenumber, setPhonenumber] = useState('')
  const [currentgrade, setCurrentgrade] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')

  const courses = [
    'Rubik’s Cube Mastery',
    'Number Ninja (Ages 6-9)',
    'Number Ninja (Ages 9-11)',
    'Private Tutoring (Spring Break)',
    'Sacred Geometry (10+)',
    'Euclid’s Elements (10+)',
    'Number Ninjas (7-12)',
    'Misinformation Detective (10+)',
    'Math For Trades (14-18)',
    'Sacred Geometry (10+)',
    'Euclid Elements (10+)',
    'Number Ninjas (7-12)',
    'Differential Equations',
    'Misinformation Detective (10+)',
  ]

  // ✅ Function to handle Grade Input (Prevent negative values)
  const handleGradeChange = (e) => {
    let value = e.target.value

    // ✅ Allow input to be empty for Backspace
    if (value === '') {
      setCurrentgrade('')
      return
    }

    // ✅ Remove non-numeric characters except digits
    value = value.replace(/[^0-9]/g, '')

    // ✅ Convert to number
    let gradeNumber = Number(value)

    // ✅ Ensure grade is between 1 and 12
    if (gradeNumber < 1) gradeNumber = 1
    if (gradeNumber > 100) gradeNumber = 100

    setCurrentgrade(gradeNumber.toString())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!firstname || !lastname || !email || !phonenumber || !currentgrade || !selectedCourse) {
      toast.error('All fields are required!')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    const phoneRegex = /^[0-9]{10,}$/
    if (!phoneRegex.test(phonenumber)) {
      toast.error('Phone number must be at least 10 digits.')
      return
    }

    console.log('🟡 Sending Data to Backend:', {
      email,
      firstname,
      lastname,
      phonenumber,
      currentgrade,
      selectedCourse,
    })

    try {
      const response = await axios.post(
        'https://backend-production-cbe2.up.railway.app/api/waitlist',
        {
          email,
          firstname,
          lastname,
          phonenumber,
          currentgrade,
          selectedCourse,
        },
      )

      console.log('✅ Backend Response:', response.data)

      if (response.data.success) {
        toast.success('Your request has been sent! Admin will contact you soon.')
        setIsFormModalOpen(false)
      } else {
        toast.error('Failed to send request. Try again.')
      }
    } catch (error) {
      console.error('❌ API Error:', error)
      toast.error('Something went wrong.')
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 mt-14 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-gray-800">Join The Waitlist</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            placeholder="First Name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phonenumber}
            onChange={(e) => setPhonenumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />

          {/* ✅ Updated Grade Input (Only Numbers 1-12 Allowed) */}
          <input
            type="text"
            placeholder="Current Grade (1-100)"
            value={currentgrade}
            onChange={handleGradeChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />

          {/* ✅ Dropdown for Course Selection */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select a Course</option>
            {courses.map((course, index) => (
              <option key={index} value={course}>
                {course}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full bg-deepBlue text-white py-2 mt-4 rounded-lg hover:bg-sky-600"
          >
            Submit
          </button>
          <button
            onClick={() => setIsFormModalOpen(false)}
            className="w-full mt-2 text-gray-600 underline text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

export default WaitlistForm

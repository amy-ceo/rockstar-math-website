import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../utils/axiosInstance'
import { toast, Toaster } from 'react-hot-toast' // ✅ FIXED IMPORT

const ResetPassword = () => {
  const { token } = useParams() // Get the token from the URL
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axiosInstance.put(`/auth/reset-password/${token}`, { password })
      toast.success(response.data.message) // Notify the user of success
      navigate('/login') // Redirect to the login page after success
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Toaster position="top-right" /> {/* ✅ Toast Notifications */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-gray-800">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your new password below to reset your account password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-yellow-400 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg shadow-md font-bold text-sm hover:bg-yellow-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-yellow-500 font-medium hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

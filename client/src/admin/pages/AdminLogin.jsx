import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa' // Import Eye Icons
import { toast, Toaster } from 'react-hot-toast' // ✅ Import Hot Toast

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch('https://backend-production-cbe2.up.railway.app/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      // ✅ Store admin token & data in localStorage
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminData', JSON.stringify(data.admin))

      // ✅ Show Success Toast & Redirect
      toast.success('Login Successful! Redirecting...')
      setTimeout(() => (window.location.href = '/admin/dashboard'), 2000)
    } catch (err) {
      // ✅ Show Error Toast
      toast.error(err.message || 'Login Failed!')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Toaster position="top-right" reverseOrder={false} /> {/* ✅ Toast Container */}
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <div className="text-center">
          <img src="/images/logo.png" alt="RockstarMath" className="mx-auto w-52 mb-4" />
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="text-gray-500">
            Welcome back! Please log in to access your admin dashboard.
          </p>
        </div>

        <form className="mt-6" onSubmit={handleLogin}>
          <label className="block font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block mt-4 font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 pr-10"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* ✅ Eye Icon */}
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          {/* ✅ Forgot Password Link */}
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => navigate('/admin/forgot-password')}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mt-6"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin

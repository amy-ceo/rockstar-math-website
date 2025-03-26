import React, { useState, Suspense, lazy } from 'react'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'react-hot-toast' // ✅ FIXED IMPORT

import { useAuth } from '../context/AuthContext'
import axios from 'axios'

// ✅ Configure Toast globally

// Lazy Load Forgot Password Component
const ForgotPassword = lazy(() => import('../components/ForgotPassword.jsx'))

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  })

  const navigate = useNavigate()
  const { login } = useAuth()

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // ✅ Handle Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        'https://backend-production-cbe2.up.railway.app/api/auth/login',
        {
          username: formData.username,
          password: formData.password,
        },
      )

      console.log('✅ Server Response:', response.data)

      if (!response.data || !response.data.token || !response.data.user) {
        toast.error('❌ Invalid server response!', { position: 'top-center' })
        return
      }

      const { token, user } = response.data

      // ✅ Store token & user
      if (formData.rememberMe) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        sessionStorage.setItem('token', token)
        sessionStorage.setItem('user', JSON.stringify(user))
      }

      // ✅ Update Auth Context
      login(user)
      toast.success('🎉 Login successful! Redirecting...', { position: 'top-center' })

      // ✅ Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (error) {
      toast.error(error.response?.data?.message || '❌ Invalid credentials!', {
        position: 'top-center',
      })
    }
  }

  return (
    <div className="flex">
      {/* Left Side (Image Section) */}
      <Toaster position="right" /> {/* ✅ Toast Notifications */}
      <div className="hidden w-1/2 bg-white xl:flex">
        <img src="/images/login.jpg" loading="lazy" alt="Login Image" className="w-full" />
      </div>
      {/* Right Side (Form Section) */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center mt-36 mb-36 px-10 md:px-20 lg:px-48">
        <img src="/images/logo.png" alt="Logo" className="w-[280px] h-auto" />
        <h1 className="text-5xl font-bold text-black mb-2">Login</h1>
        <p className="text-gray-600 mb-6">Welcome back! Please log in to access your account.</p>

        <form className="w-full" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-bold text-black mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 bg-gray-200 rounded-lg outline-none"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4 w-full relative">
            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 bg-gray-200 rounded-lg outline-none"
            />
            <div
              className="absolute right-4 top-[55%] text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex justify-between w-full mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 mr-2 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-gray-700 cursor-pointer">
                Remember Me
              </label>
            </div>
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
              <Link to="/forgot-password" className="text-sm text-blue-500">
                Forgot Password?
              </Link>
            </Suspense>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-deepBlue text-white py-2 rounded hover:bg-sky-600 transition-all duration-500"
          >
            Login
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <NavLink to="/signup" className="text-blue-500">
            Sign up now
          </NavLink>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

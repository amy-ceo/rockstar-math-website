import React, { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔹 Sending Password Reset Request for Email:', email)

      const res = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/admin/request-password-reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      )

      const data = await res.json()
      console.log('🔹 API Response:', data)

      if (!res.ok) {
        console.error('❌ Forgot Password Error:', data)
        toast.error(data.message || 'Something went wrong!')
        return
      }

      toast.success('✅ Password reset email sent successfully!')
    } catch (err) {
      console.error('❌ Error in Request:', err)
      toast.error(err.message || 'Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Admin Password Reset</h2>
        <form className="mt-6" onSubmit={handleForgotPassword}>
          <label className="block font-medium text-gray-700">Enter your email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mt-4"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminForgotPassword

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

const AdminResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔹 Sending Reset Request with Token:', token)

      const res = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/admin/reset-password/${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        },
      )

      const data = await res.json()
      console.log('🔹 API Response:', data)

      if (!res.ok) {
        console.error('❌ Password Reset Error:', data)
        toast.error(data.message || 'Something went wrong!')
        return
      }

      toast.success('✅ Password reset successful!')
      setTimeout(() => navigate('/admin'), 2000)
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
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <form className="mt-6" onSubmit={handleResetPassword}>
          <label className="block font-medium text-gray-700">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 mt-4"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminResetPassword

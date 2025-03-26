import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaSync, FaSearch, FaMoneyBillWave } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await axios.get(
        'https://backend-production-cbe2.up.railway.app/api/admin/stripe-payments',
      )
      setPayments(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments.')
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return
    try {
      await axios.post(`https://backend-production-cbe2.up.railway.app/api/admin/refund-payment`, {
        paymentId,
      })
      toast.success('Payment refunded successfully.')
      fetchPayments() // Refresh payment list
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error('Failed to process refund.')
    }
  }

  const filteredPayments = payments.filter((payment) => {
    return (
      (payment.id.includes(searchQuery) ||
        payment.metadata?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus ? payment.status === filterStatus : true)
    )
  })

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin - Payments</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h4 className="text-lg font-bold">Total Revenue</h4>
          <p className="text-2xl font-semibold">
            ${payments.reduce((sum, payment) => sum + payment.amount_received / 100, 0)}
          </p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <h4 className="text-lg font-bold">Total Transactions</h4>
          <p className="text-2xl font-semibold">{payments.length}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          <h4 className="text-lg font-bold">Failed Transactions</h4>
          <p className="text-2xl font-semibold">
            {payments.filter((p) => p.status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex justify-between mb-4">
        <div className="flex items-center border p-2 rounded-lg">
          <FaSearch className="mr-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ID or Name"
            className="outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="border p-2 rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payment Table */}
      {loading ? (
        <p className="text-gray-600 text-lg">Loading payments...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-800">
                <th className="py-3 px-4 border">Transaction ID</th>
                <th className="py-3 px-4 border">User</th>
                <th className="py-3 px-4 border">Amount</th>
                <th className="py-3 px-4 border">Status</th>
                <th className="py-3 px-4 border">Payment Method</th>
                <th className="py-3 px-4 border">Date</th>
                <th className="py-3 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="text-center">
                  <td className="py-3 px-4 border">{payment.id}</td>
                  <td className="py-3 px-4 border">{payment.metadata?.customer_name || 'N/A'}</td>
                  <td className="py-3 px-4 border">${payment.amount_received / 100}</td>
                  <td
                    className={`py-3 px-4 border ${
                      payment.status === 'succeeded' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {payment.status}
                  </td>
                  <td className="py-3 px-4 border">{payment.payment_method_types[0]}</td>
                  <td className="py-3 px-4 border">
                    {new Date(payment.created * 1000).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 border">
                    {payment.status === 'succeeded' && (
                      <button
                        onClick={() => handleRefund(payment.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        <FaMoneyBillWave /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Payments

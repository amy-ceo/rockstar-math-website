import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { FaSearch, FaMoneyBillWave } from 'react-icons/fa' // FaSync removed as auto-update will handle it
import toast, { Toaster } from 'react-hot-toast'
import io from 'socket.io-client' // Import socket.io-client

const SOCKET_SERVER_URL = 'https://backend-production-cbe2.up.railway.app' // Your backend URL

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('') // This should match Stripe's payment_intent statuses

  // State for summary card data
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    failedTransactions: 0,
  })

  const calculateSummary = useCallback((currentPayments) => {
    const revenue = currentPayments
      .filter((p) => p.status === 'succeeded') // Only successful for revenue
      .reduce(
        (sum, payment) =>
          sum + (payment.amount_received ? payment.amount_received / 100 : payment.amount || 0),
        0,
      ) // amount_received is from Stripe Charge, amount from PaymentIntent
    const transactions = currentPayments.length
    const failed = currentPayments.filter(
      (p) => ['failed', 'requires_payment_method', 'canceled'].includes(p.status), // Define your failed states
    ).length

    setSummary({
      totalRevenue: revenue,
      totalTransactions: transactions,
      failedTransactions: failed,
    })
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${SOCKET_SERVER_URL}/api/admin/stripe-payments`)
      // Stripe payment intents have `id` (pi_xxx), `amount`, `created`, `status`
      // The data you map in the table uses `payment.id`, `payment.amount_received / 100`, `payment.status`, `payment.payment_method_types[0]`, `payment.created`
      // Ensure your backend /api/admin/stripe-payments returns data in this structure.
      // Typically, list payment intents.
      setPayments(response.data)
      calculateSummary(response.data) // Calculate summary on initial fetch
      setLoading(false)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments.')
      setLoading(false)
    }
  }, [calculateSummary])

  useEffect(() => {
    fetchPayments()

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('Payments page connected to WebSocket server')
    })

    // Listen for new payments
    socket.on('newPaymentProcessed', (newPayment) => {
      console.log('New payment received via socket:', newPayment)
      toast.success('New payment received!')
      setPayments((prevPayments) => {
        const updatedPayments = [newPayment, ...prevPayments.filter((p) => p.id !== newPayment.id)]
        calculateSummary(updatedPayments)
        return updatedPayments
      })
    })

    // Listen for updates to existing payments (e.g., after refund)
    socket.on('paymentUpdated', (updatedPaymentData) => {
      console.log('Payment update received via socket:', updatedPaymentData)
      toast.info(`Payment ${updatedPaymentData.id} status updated to ${updatedPaymentData.status}.`)
      setPayments((prevPayments) => {
        const updatedPayments = prevPayments.map((p) =>
          p.id === updatedPaymentData.id ? { ...p, ...updatedPaymentData } : p,
        )
        calculateSummary(updatedPayments)
        return updatedPayments
      })
    })

    // Listen for summary updates (can be more granular if needed)
    socket.on('paymentSummaryUpdated', (newSummary) => {
      console.log('Payment summary update received via socket:', newSummary)
      setSummary((prevSummary) => ({ ...prevSummary, ...newSummary }))
    })

    socket.on('disconnect', () => {
      console.log('Payments page disconnected from WebSocket server')
    })

    return () => {
      socket.disconnect()
    }
  }, [fetchPayments, calculateSummary])

  const handleRefund = async (paymentIntentId) => {
    if (
      !window.confirm('Are you sure you want to refund this payment? This action is irreversible.')
    )
      return
    const toastId = toast.loading('Processing refund...')
    try {
      // The backend `refundPayment` now handles updating DB and emitting socket events
      await axios.post(`${SOCKET_SERVER_URL}/api/admin/refund-payment`, {
        paymentId: paymentIntentId, // Send the Payment Intent ID
      })
      toast.success('Refund successfully initiated. List will update.', { id: toastId })
      // No need to call fetchPayments() here, socket event will update the list
    } catch (error) {
      console.error('Error processing refund:', error.response ? error.response.data : error)
      const errorMessage = error.response?.data?.message || 'Failed to process refund.'
      toast.error(errorMessage, { id: toastId })
    }
  }

  // Filter logic needs to adapt if `payment.id` is `pi_xxx` and `searchQuery` targets that
  // And if `payment.metadata.customer_name` is not directly on the payment intent object from `/stripe-payments`
  // You might need to populate user details on the backend if you want to search by name.
  // For now, assuming `payment.id` is what you search for.
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      payment.paymentIntentId?.toLowerCase().includes(searchLower) || // Assuming paymentIntentId is the primary ID
      payment.userId?.username?.toLowerCase().includes(searchLower) || // If you populate username
      payment.billingEmail?.toLowerCase().includes(searchLower) // If you have billingEmail

    const matchesStatus = filterStatus ? payment.status === filterStatus : true
    return matchesSearch && matchesStatus
  })

  // Make sure the data structure from your API matches what the table expects
  // payment.id (Stripe Payment Intent ID: pi_xxxxxx)
  // payment.metadata?.customer_name (This usually isn't standard on PaymentIntent, you might need to fetch charge or session)
  // payment.amount_received / 100 (This is from Charge object, PaymentIntent has `amount`)
  // payment.status (e.g., 'succeeded', 'requires_payment_method', 'refunded')
  // payment.payment_method_types[0] (e.g., 'card')
  // payment.created (Unix timestamp, needs conversion)

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin - Payments</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
          <h4 className="text-lg font-bold">Total Revenue</h4>
          <p className="text-2xl font-semibold">
            $
            {summary.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
          <h4 className="text-lg font-bold">Total Transactions</h4>
          <p className="text-2xl font-semibold">{summary.totalTransactions}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-md">
          <h4 className="text-lg font-bold">Problem Transactions</h4> {/* Renamed for clarity */}
          <p className="text-2xl font-semibold">{summary.failedTransactions}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center border p-2 rounded-lg w-full sm:w-auto">
          <FaSearch className="mr-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ID, Email, or Name"
            className="outline-none flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="border p-2.5 rounded-lg w-full sm:w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="requires_payment_method">Requires Payment Method</option>
          <option value="processing">Processing</option>
          <option value="canceled">Canceled</option>
          <option value="failed">Failed</option> {/* Assuming 'failed' is a status you might get */}
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading payments...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  User/Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.paymentIntentId || payment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.paymentIntentId || payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.userId?.username || payment.billingEmail || 'N/A'}{' '}
                      {/* Adjust based on populated data */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      $
                      {(payment.amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {/* Assuming amount is in dollars now */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'refunded'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ['failed', 'requires_payment_method', 'canceled'].includes(
                                payment.status,
                              )
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.status?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(payment.createdAt || payment.created * 1000).toLocaleDateString()}{' '}
                      {/* Use createdAt from DB if available */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(payment.status === 'succeeded' || payment.status === 'Completed') &&
                        !payment.refundId && ( // Show refund if succeeded and not already refunded
                          <button
                            onClick={() => handleRefund(payment.paymentIntentId || payment.id)}
                            className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                            title="Refund Payment"
                          >
                            <FaMoneyBillWave /> Refund
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Payments

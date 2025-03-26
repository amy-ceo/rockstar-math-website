import React, { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { FaCreditCard } from 'react-icons/fa'

const PaymentForm = ({ totalAmount, createPaymentIntent, onPaymentSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const clearCart = () => {
    // Clear from localStorage
    localStorage.removeItem('cartItems')
    // Dispatch event to sync across tabs
    window.dispatchEvent(new Event('cartUpdated'))
    // Callback to parent component if provided
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) {
      toast.error('Stripe is not loaded yet!')
      return
    }

    setLoading(true)

    try {
      const clientSecret = await createPaymentIntent()
      if (!clientSecret) {
        toast.error('❌ Payment initialization failed!')
        setLoading(false)
        return
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        toast.error('❌ Unable to retrieve card details.')
        setLoading(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (error) {
        console.error('Payment Error:', error)
        toast.error(`Payment Failed: ${error.message}`)
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Clear cart immediately
        clearCart()

        // Show success message
        toast.success('✅ Payment Successful! Redirecting...')

        // Wait for cart clearing to complete before redirecting
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error in Payment Processing:', error)
      toast.error('Unexpected payment error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toaster position="top-right" />
      <CardElement className="p-3 border border-gray-300 rounded-lg w-full" />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-lg shadow-md flex items-center justify-center gap-2"
      >
        <FaCreditCard /> {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)} USD`}
      </button>
    </form>
  )
}

export default PaymentForm

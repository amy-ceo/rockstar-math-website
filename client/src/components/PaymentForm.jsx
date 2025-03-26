import React, { useState, useEffect } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { FaCreditCard } from 'react-icons/fa'

const PaymentForm = ({ totalAmount, clientSecret, onPaymentSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const clearCart = () => {
    localStorage.removeItem('cartItems')
    window.dispatchEvent(new Event('cartUpdated'))
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  useEffect(() => {
    if (paymentCompleted) {
      clearCart()
      toast.success('✅ Payment Successful! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }, [paymentCompleted, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe is not loaded yet!')
      return
    }

    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Unable to retrieve card details')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: JSON.parse(localStorage.getItem('user'))?.billingEmail || 'no-email@example.com',
          },
        },
      })

      if (error) {
        throw error
      }

      if (paymentIntent?.status === 'succeeded') {
        setPaymentCompleted(true)
      } else {
        throw new Error(`Payment not completed. Status: ${paymentIntent?.status}`)
      }
    } catch (error) {
      console.error('Payment Error:', error)
      toast.error(`Payment Failed: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toaster position="top-right" />
      <CardElement
        className="p-3 border border-gray-300 rounded-lg w-full"
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
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

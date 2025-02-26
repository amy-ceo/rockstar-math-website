import React, { useEffect, useState, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCreditCard } from 'react-icons/fa'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import toast, { Toaster } from 'react-hot-toast'
import 'react-toastify/dist/ReactToastify.css'

// Lazy Load Components
const PaymentForm = lazy(() => import('../components/PaymentForm'))

// ✅ Load Stripe Public Key
const stripePromise = loadStripe(
  'pk_live_51QKwhUE4sPC5ms3x7cYIFoYqx3lULz1hFA9EoRobabZVPwdDm8KbDNlHOZMizb2YftdwRSyxRfyi93ovv5Rev7i300CpaQEtU2',
)

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([])

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [validCoupons, setValidCoupons] = useState([]) // Store valid coupons
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        if (!user || !user._id) return

        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user-coupons/${user._id}`,
        )
        const data = await response.json()

        console.log('✅ Coupons from Backend:', data.coupons)
        setValidCoupons(data.coupons)
      } catch (error) {
        console.error('❌ Error fetching coupons:', error)
      }
    }

    fetchCoupons()
  }, [])

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cartItems')) || []
    if (!storedCart || storedCart.length === 0) {
      navigate('/cart')
    } else {
      setCartItems(storedCart)
      const calculatedSubtotal = storedCart.reduce(
        (total, item) => total + Number(item.price || 0),
        0,
      )
      setSubtotal(calculatedSubtotal)
      setTotal(calculatedSubtotal) // ✅ Initially, total = subtotal
    }
  }, [navigate])

  // ✅ Create PayPal Order
  const createPayPalOrder = async () => {
    if (total <= 0) {
      toast.error('Invalid order: Total cannot be $0.00!')
      throw new Error('Invalid order amount.')
    }

    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user._id) {
      toast.error('User not logged in!')
      throw new Error('User authentication required.')
    }

    try {
      console.log('📡 Creating PayPal Order...')
      const response = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/paypal/create-order`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            amount: Number(total.toFixed(2)),
            cartItems: cartItems.map((item) => ({
              name: item.name,
              price: (Number(item.price) || 0).toFixed(2),
              quantity: item.quantity || 1,
            })),
          }),
        },
      )

      if (!response.ok) {
        toast.error('❌ Failed to create PayPal order.')
        throw new Error('PayPal order creation failed.')
      }

      const data = await response.json()
      console.log('🚀 PayPal Order Response:', data)

      if (!data.orderId) {
        toast.error('❌ No orderId returned from backend.')
        throw new Error('No orderId returned.')
      }

      return data.orderId
    } catch (error) {
      console.error('❌ PayPal Order Creation Error:', error)
      toast.error('PayPal order creation failed.')
      return null
    }
  }

  const handlePayPalSuccess = async (data) => {
    const user = JSON.parse(localStorage.getItem('user'))

    if (!user || !user._id) {
      toast.error('User authentication required.')
      throw new Error('User authentication required.')
    }

    try {
      console.log('📡 Capturing PayPal Order...')
      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/paypal/capture-order',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderID,
            user: {
              _id: user._id,
              username: user.username || 'Unknown User',
              billingEmail: user.billingEmail || 'No email',
              phone: user.phone || 'No phone',
              cartItems: cartItems.map((item) => ({
                name: item.name,
                price: Number(item.price) || 0,
                quantity: item.quantity || 1,
              })),
            },
          }),
        },
      )

      const result = await response.json()
      console.log('📡 PayPal Capture Response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'PayPal capture failed.')
      }

      // ✅ Step 2: Call `addPurchasedClass` API to update user purchases
      console.log('📡 Calling addPurchasedClass API...')
      const purchaseResponse = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/add-purchased-class',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            purchasedItems: cartItems.map((item) => ({
              name: item.name,
              description: item.description || 'No description available',
            })),
            userEmail: user.billingEmail || 'No email',
          }),
        },
      )

      const purchaseResult = await purchaseResponse.json()
      console.log('✅ Purchased Classes API Response:', purchaseResult)

      if (!purchaseResponse.ok) {
        console.warn('⚠️ Issue updating purchased classes:', purchaseResult.message)
      }

      // ✅ Step 3: Fetch Updated User Data
      console.log('📡 Fetching updated user data...')
      const userResponse = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/user/${user._id}`,
      )

      if (!userResponse.ok) {
        console.warn('⚠️ Failed to fetch updated user data.')
      } else {
        const updatedUser = await userResponse.json()
        console.log('✅ Updated User Data:', updatedUser)

        // ✅ Step 4: Update Local Storage with New Purchased Classes
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      // ✅ **Clear Cart Properly**
      localStorage.removeItem('cartItems')
      setCartItems([])
      window.dispatchEvent(new Event('storage'))

      toast.success('🎉 Payment Successful! Redirecting...')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (error) {
      console.error('❌ Error in Payment Process:', error)
      toast.error(error.message || 'Payment processing error.')
    }
  }

  // ✅ Function to Apply Coupon
  const applyCoupon = () => {
    console.log('🔍 Entered Coupon Code:', couponCode)
    console.log('✅ Available Coupons:', validCoupons)

    const coupon = validCoupons.find((c) => c.code.toLowerCase() === couponCode.toLowerCase())

    if (!coupon) {
      toast.error('❌ Invalid Coupon Code!')
      return
    }

    const discountAmount = (subtotal * coupon.percent_off) / 100
    setDiscount(discountAmount)

    // ✅ Fix: Update Total Amount Using State
    setTotal(subtotal - discountAmount)

    toast.success(`🎉 Coupon Applied! ${coupon.percent_off}% Off`)
  }

  // ✅ Prevent $0.00 Payments
  const handleZeroAmount = () => {
    toast.error('Cannot process a payment of $0.00!')
  }

  // ✅ Create Stripe Payment Intent
    // ✅ Create Stripe Payment Intent
    const createPaymentIntent = async () => {
      if (total <= 0) {
        handleZeroAmount();
        return null;
      }
    
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user._id) {
          toast.error("User authentication required!");
          return;
        }
    
        const orderId = `order_${Date.now()}`;
        const currency = "usd";
    
        // ✅ Convert Cart Items to Proper Format
        const formattedCartItems = cartItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "No description available",
          price: String(item.price), // Ensure price is a string
          currency: item.currency || "USD"
        }));
    
        console.log("🔹 Sending Payment Request:", {
          amount: total,
          currency,
          userId: user._id,
          orderId,
          cartItems: formattedCartItems, // ✅ Send formatted cart items
        });
    
        const response = await fetch("https://backend-production-cbe2.up.railway.app/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency,
            userId: user._id,
            orderId,
            cartItems: formattedCartItems, // ✅ Fix data format
          }),
        });
    
        if (!response.ok) {
          console.error("❌ Failed to create payment intent. Status:", response.status);
          throw new Error(`Payment Intent creation failed. Server responded with ${response.status}`);
        }
    
        const data = await response.json();
        console.log("✅ Payment Intent Created:", data);
    
        setPaymentIntentId(data.id);
        setClientSecret(data.clientSecret);
    
        return data.clientSecret;
      } catch (error) {
        console.error("❌ Payment Intent Error:", error);
        toast.error(`Payment Error: ${error.message}`);
        return null;
      }
    };
    

    const handlePaymentSuccess = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user._id) {
          toast.error("User authentication required!");
          return;
        }
    
        console.log("📡 Capturing Stripe Payment...");
        const response = await fetch(
          "https://backend-production-cbe2.up.railway.app/api/stripe/capture-stripe-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentIntentId,
              user: {
                _id: user._id,
                username: user.username || "Unknown User",
                billingEmail: user.billingEmail || "No email",
                phone: user.phone || "No phone",
                cartItems: cartItems.map((item) => ({
                  name: item.name,
                  price: Number(item.price) || 0,
                  quantity: item.quantity || 1,
                })),
              },
            }),
          }
        );
    
        const result = await response.json();
        console.log("📡 Stripe Capture Response:", result);
    
        if (!response.ok) {
          throw new Error(result.error || "Stripe payment capture failed.");
        }
    
        // ✅ **Step 2: Call `addPurchasedClass` API to update user purchases**
        console.log("📡 Calling addPurchasedClass API...");
        const purchaseResponse = await fetch(
          "https://backend-production-cbe2.up.railway.app/api/add-purchased-class",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              purchasedItems: cartItems.map((item) => ({
                name: item.name,
                description: item.description || "No description available",
              })),
              userEmail: user.billingEmail || "No email",
            }),
          }
        );
    
        const purchaseResult = await purchaseResponse.json();
        console.log("✅ Purchased Classes API Response:", purchaseResult);
    
        if (!purchaseResponse.ok) {
          console.warn("⚠️ Issue updating purchased classes:", purchaseResult.message);
        }
    
        // ✅ **Step 3: Fetch Updated User Data**
        console.log("📡 Fetching updated user data...");
        const userResponse = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user/${user._id}`
        );
    
        if (!userResponse.ok) {
          console.warn("⚠️ Failed to fetch updated user data.");
        } else {
          const updatedUser = await userResponse.json();
          console.log("✅ Updated User Data:", updatedUser);
    
          // ✅ **Step 4: Update Local Storage with New Purchased Classes**
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
    
        // ✅ **Clear Cart Properly**
        localStorage.removeItem("cartItems");
        setCartItems([]);
        window.dispatchEvent(new Event("storage"));
    
        toast.success("🎉 Payment Successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } catch (error) {
        console.error("❌ Error in Payment Process:", error);
        toast.error(error.message || "Payment processing error.");
      }
    };
    
    

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <Toaster position="top-right" />
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Review Order */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Order</h2>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 border-b border-gray-200"
            >
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-green-600 font-bold text-lg">
                  ${Number(item.price || 0).toFixed(2)} USD
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
          <div className="flex justify-between text-gray-900 font-bold text-xl">
            <p>Total:</p>
            <p>${total.toFixed(2)} USD</p>
          </div>
          {!showPaymentForm && (
            <>
              {/* Stripe Payment Button */}
              <button
                onClick={() => {
                  if (total > 0) {
                    setShowPaymentForm(true)
                    createPaymentIntent()
                  } else {
                    handleZeroAmount()
                  }
                }}
                className="w-full px-6 py-3 mt-5 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-lg shadow-md flex items-center justify-center gap-2"
              >
                <FaCreditCard /> Pay ${total.toFixed(2)} USD
              </button>
              <div className="mt-4">
                <label className="block text-lg font-medium text-gray-700">Apply Coupon</label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-1"
                  >
                    Apply
                  </button>
                </div>
              </div>
              {discount > 0 && (
                <p className="text-green-600 font-bold mt-2">
                  Discount Applied: -${discount.toFixed(2)} USD
                </p>
              )}
              {/* PayPal Payment Integration */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Or Pay with PayPal</h2>
                <PayPalScriptProvider
                  options={{
                    'client-id':
                      'AaZbEygWpyKJsxxTXfZ5gSpgfm2rzf_mCanmJb80kbNg1wvj6e0ktu3jzxxjKYjBOLSkFTeMSqDLAv4L',
                    intent: 'capture',
                    commit: true,
                  }}
                >
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'paypal' }}
                    createOrder={async () => {
                      const orderId = await createPayPalOrder()
                      console.log('🔹 PayPal Order ID:', orderId)
                      if (!orderId) {
                        toast.error('❌ PayPal order creation failed.')
                        return
                      }
                      return orderId
                    }}
                    onApprove={async (data, actions) => {
                      console.log('✅ Payment Approved:', data.orderID)
                      try {
                        await handlePayPalSuccess(data)
                      } catch (error) {
                        console.error('❌ PayPal Payment Error:', error)
                        toast.error('Payment failed. Please try again.')
                      }
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            </>
          )}

          {/* Stripe Payment */}
          {showPaymentForm && clientSecret && (
            <Suspense
              fallback={
                <div className="text-center py-10 text-gray-500">Loading Payment Form...</div>
              }
            >
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Enter Card Details</h2>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    totalAmount={total}
                    paymentIntentId={paymentIntentId}
                    createPaymentIntent={createPaymentIntent}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
                <button
                  onClick={() => setShowPaymentForm(false)} // ✅ Go Back to Coupon Form
                  className="w-full flex justify-center underline mt-5"
                >
                  Go Back
                </button>
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage

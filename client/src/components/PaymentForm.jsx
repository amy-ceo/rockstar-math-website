import React, { useState, useEffect } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import toast, { Toaster } from 'react-hot-toast';
import { FaCreditCard } from "react-icons/fa";

const PaymentForm = ({ totalAmount, createPaymentIntent, handlePaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("✅ handlePaymentSuccess received in PaymentForm:", handlePaymentSuccess);
  }, [handlePaymentSuccess]); // ✅ Dependency added

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("🚀 handleSubmit triggered!");

    if (!stripe || !elements) return;
    setLoading(true);

    try {
      if (typeof createPaymentIntent !== 'function') {
        console.error("❌ createPaymentIntent function is not provided.");
        toast.error("Payment initialization failed!");
        setLoading(false);
        return;
      }

      const clientSecret = await createPaymentIntent();
      if (!clientSecret) {
        toast.error("❌ Payment initialization failed!");
        setLoading(false);
        return;
      }

      console.log("🔹 Using clientSecret:", clientSecret);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        toast.error(`Payment Failed: ${error.message}`);
        setLoading(false); // ✅ Ensure state is reset
        return;
      }

      if (paymentIntent.status === "requires_action") {
        toast.info("Additional authentication required. Completing...");
        
        const { error: authError, paymentIntent: updatedPaymentIntent } = await stripe.confirmCardPayment(clientSecret);

        if (authError) {
          toast.error(`Payment Failed: ${authError.message}`);
          setLoading(false); // ✅ Reset loading
          return;
        }

        if (updatedPaymentIntent.status === "succeeded") {
          toast.success("✅ Payment Successful!");
          await handlePaymentSuccess();
        }
      } else if (paymentIntent.status === "succeeded") {
        toast.success("✅ Payment Successful!");
        await handlePaymentSuccess();
      }
      
    } catch (error) {
      console.error("❌ Error in Payment Processing:", error);
      toast.error("Unexpected payment error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toaster position="top-right" />
      <CardElement className="p-3 border border-gray-300 rounded-lg w-full" />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-lg shadow-md flex items-center justify-center gap-2"
      >
        <FaCreditCard /> {loading ? "Processing..." : `Pay $${totalAmount.toFixed(2)} USD`}
      </button>
    </form>
  );
};

export default PaymentForm;

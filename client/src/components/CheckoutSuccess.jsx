import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown before redirecting
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect to dashboard after 5 seconds
    const timeout = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-green-600 mb-4">🎉 Payment Successful!</h1>
      <p className="text-lg text-gray-600 mb-6">Redirecting to your dashboard in {countdown} seconds...</p>
      <img src="/images/welcome.gif" alt="Welcome" className="w-64 h-auto" />
    </div>
  );
};

export default CheckoutSuccess;

import React, { useEffect, useRef, useState } from 'react';

function PayPal() {
  const paypalRef = useRef();
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      setSdkLoaded(true);
      return;
    }

    // Load PayPal SDK dynamically
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AeomWj4L8mlq-ezy4Uv0He0-zb4HV5rYqv-qPDczww0pqQAirAxpF-kv33JYwDvn9ChImPjuu5eB&currency=USD";
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (sdkLoaded && window.paypal) {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        },
        createOrder: async () => {
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: '10.00' }),
          });
          const data = await response.json();
          return data.orderId;
        },
        onApprove: async (data) => {
          await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          alert('Payment Successful!');
        },
      }).render(paypalRef.current);
    }
  }, [sdkLoaded]);

  return <div ref={paypalRef}></div>;
}

export default PayPal;

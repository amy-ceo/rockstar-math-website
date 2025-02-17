import React from "react";

const CartSummary = ({ cartItems, handleProceedToCheckout }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-300 max-h-60">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Subtotal:</h2>
      <p className="text-3xl font-bold text-gray-900">
        ${Number(cartItems.reduce((total, item) => total + Number(item.price || 0), 0)).toFixed(2)} USD
      </p>

      <button
        onClick={handleProceedToCheckout}
        className="w-full px-6 py-3 mt-4 text-lg font-semibold text-white bg-deepBlue hover:bg-sky-600 transition-all duration-300 rounded-lg shadow-lg"
      >
        Checkout Now
      </button>
    </div>
  );
};

export default CartSummary;

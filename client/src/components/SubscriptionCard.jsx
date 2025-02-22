import React from "react";

const SubscriptionCard = ({ plan, handleSubscribe }) => {
  return (
    <div className="relative bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center flex flex-col justify-between">
      
      {/* 🔹 Ribbon at Top Right */}
      {plan.discount && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold py-1 px-3 transform rotate-45 translate-x-6 -translate-y-3 shadow-md">
          {plan.discount}
        </div>
      )}

      {/* ✅ Plan Header */}
      <div className="flex flex-col items-center mb-4">
        <img
          src={plan.images || "/default-image.png"}
          alt={plan.name}
          className="w-24 h-24 object-contain mb-3"
        />
        <h3 className="text-2xl font-semibold text-gray-800">{plan.name}</h3>
      </div>

      {/* ✅ Price */}
      <p className="text-3xl font-bold text-gray-900 my-3">
        ${plan.price !== "N/A" ? plan.price : "Not Available"}{" "}
        <span className="text-sm text-gray-500">/ {plan.currency}</span>
      </p>

      {/* ✅ Description */}
      <p className="text-sm text-gray-600 my-4">{plan.description}</p>

      {/* ✅ Subscribe Button */}
      <button
        className="mt-auto bg-blue-600 text-white w-full py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
        onClick={() => handleSubscribe(plan)}
      >
        Subscribe
      </button>
    </div>
  );
};

export default SubscriptionCard;

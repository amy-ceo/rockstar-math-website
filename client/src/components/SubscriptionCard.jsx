import React from "react";

const SubscriptionCard = ({ plan, handleSubscribe }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center flex flex-col justify-between">
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

      {/* ✅ Subscribe Button (Add to Cart) */}
      <button
        className="mt-auto bg-blue-600 text-white w-full py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
        onClick={() => handleSubscribe(plan)} // ✅ Add to Cart & Show Toast
      >
        Subscribe
      </button>
    </div>
  );
};

export default SubscriptionCard;

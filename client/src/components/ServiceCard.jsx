import React from "react";
import { FaShoppingCart } from "react-icons/fa";
import './ribbon.css'; // ✅ Import Ribbon CSS

const ServiceCard = ({ service, handleAddToCart }) => {
  return (
    <div className="relative bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center flex flex-col justify-between">
      
      {/* ✅ Dynamically Colored Ribbon (Fix Applied) */}
      {service.ribbonText && (
        <div className="ribbon">
          <span className={`text-white text-xs font-bold py-1 px-3 shadow-md ${service.ribbonColor}`}>
            {service.ribbonText}
          </span>
        </div>
      )}

      {/* ✅ Service Header */}
      <div className="flex flex-col items-center mb-4">
        <img
          src={service.images && service.images.length > 0 ? service.images : "/default-placeholder.png"}
          alt={service.name}
          className="w-24 h-24 object-contain mb-3"
        />
        <h3 className="text-2xl font-semibold text-gray-800">{service.name}</h3>
      </div>

      {/* ✅ Price Section */}
      <p className="text-3xl font-bold text-gray-900 my-3">
        {service.price === "Price Not Available" ? (
          <span className="text-red-500">Price Not Available</span>
        ) : (
          `$${service.price} USD`
        )}
      </p>

      {/* ✅ Description */}
      <p className="text-sm text-gray-600 my-4 flex-grow">{service.description || "No description available"}</p>

      {/* ✅ Buy Now Button */}
      <button
        className={`mt-auto w-full py-3 rounded-lg font-medium transition-all ${
          service.price === "Price Not Available"
            ? "bg-gray-300 text-gray-700 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        onClick={() => handleAddToCart(service)}
        disabled={service.price === "Price Not Available"}
      >
        <FaShoppingCart className="inline-block mr-2" />
        Buy Now to Sign-Up
      </button>
    </div>
  );
};

export default ServiceCard;

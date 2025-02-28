import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';

const ServiceCard = ({ service, handleAddToCart }) => {
  return (
    <div className="bg-slate-100 text-deepBlue border border-gray-800 shadow-xl rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <div className="border p-5 rounded-lg shadow-lg bg-white">
        <img
          src={service.images && service.images.length > 0 ? service.images : '/default-placeholder.png'}
          alt={service.name}
          className="w-full h-40 object-cover rounded-lg"
        />

        <h2 className="text-lg font-semibold text-deepBlue mt-2">{service.name}</h2>

        <p className={`font-bold text-xl ${service.price === "Price Not Available" ? "text-red-500" : "text-emerald-400"}`}>
          {service.price === "Price Not Available" ? "Price Not Available" : `$${service.price} USD`}
        </p>

        <div className="bg-blue-50 p-3 rounded-lg mt-3 border border-gray-300">
          <p className="text-sm text-gray-800">{service.description}</p>
        </div>
      </div>

      <div className="mt-4">
        <button
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all duration-300 shadow-lg ${
            service.price === "Price Not Available"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-deepBlue text-white hover:bg-blue-700"
          }`}
          onClick={() => handleAddToCart(service)}
          disabled={service.price === "Price Not Available"}
        >
          <FaShoppingCart /> Buy Now to Sign-Up
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;

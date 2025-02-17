import React from 'react'
import { FaInfoCircle, FaClock, FaCalendarAlt, FaShoppingCart } from 'react-icons/fa'

const ServiceCard = ({ service, users, handleAddToCart }) => {
  return (
    <div className="bg-slate-100 text-deepBlue border border-gray-800 shadow-xl rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <div className="border p-5 rounded-lg shadow-lg bg-white">
      {/* ✅ Service Image */}
      <img
        src={service.images[0]}
        alt={service.name}
        className="w-full h-40 object-cover rounded-lg"
      />

      {/* ✅ Service Name & Price */}
      <h2 className="text-lg font-semibold text-deepBlue mt-2">{service.name}</h2>
   <p className="text-emerald-400 font-bold text-xl">
  ${service.default_price ? (service.default_price.unit_amount / 100).toFixed(2) : "N/A"}{" "}
  {service.default_price ? service.default_price.currency.toUpperCase() : ""}
</p>

      {/* ✅ Service Details Section */}
      <div className="bg-blue-50 p-3 rounded-lg mt-3 border border-gray-300">
        <p className="text-sm flex items-center gap-2 text-gray-800">
          <strong className="text-gray-700"></strong> {service.description}
        </p>
      </div>
    </div>
      {/* ✅ Buttons Section */}
      <div className="mt-4">
     
          <div className="flex flex-col gap-3">
            <button
              className="flex items-center justify-center gap-2 bg-deepBlue text-white w-full py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-800 transition-all duration-300 shadow-lg"
              onClick={() => handleAddToCart(service)}
            >
              <FaShoppingCart /> Buy Now to Sign-Up
            </button>
          </div>
      
      </div>
    </div>
  )
}

export default ServiceCard

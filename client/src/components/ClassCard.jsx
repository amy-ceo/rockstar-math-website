import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

const ClassCard = ({ classData }) => {
  // ✅ Convert purchase date to a JavaScript Date object
  const classDate = new Date(classData.purchaseDate);
  const currentDate = new Date();

  // ✅ Check if class date has expired
  const isExpired = classDate < currentDate;

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Placeholder Image */}
      <div className="h-44 bg-gray-200 flex items-center justify-center">
        <img
          src={classData.image || "https://via.placeholder.com/300"} // Fallback Image
          alt={classData.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Class Info */}
      <div className="p-5">
        {/* Class Name */}
        <h3 className="text-lg font-semibold text-gray-800 truncate">{classData.name}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{classData.description}</p>

        {/* Purchase Date */}
        <div className="flex items-center text-gray-500 text-sm mt-3">
          <FaCalendarAlt className="mr-2 text-sky-500" />
          <span>{classDate.toLocaleDateString()}</span>
        </div>

        {/* ✅ Show Archive Button Only if Class is NOT Expired */}
        {!isExpired && (
          <button
            className="mt-3 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-all"
          >
            📂 Archive
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;

import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

const ClassCard = ({ classData, userId, setPurchasedClasses }) => {
  
  const handleArchive = async () => {
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }

    try {
      console.log(`📂 Archiving class: ${classData.name} for user: ${userId}`);

      const response = await fetch("https://backend-production-cbe2.up.railway.app/api/archive-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, className: classData.name }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to archive class.");

      console.log("✅ Class archived successfully:", data);

      // ✅ Remove Archived Class from UI
      setPurchasedClasses((prev) => prev.filter((c) => c.name !== classData.name));
      alert(`📂 ${classData.name} archived successfully!`);
    } catch (error) {
      console.error("❌ Error archiving class:", error);
      alert("Failed to archive class. Try again.");
    }
  };

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
          <span>{new Date(classData.purchaseDate).toLocaleDateString()}</span>
        </div>

        {/* ✅ Archive Button */}
        <button
          className="mt-3 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-all"
          onClick={handleArchive} // ✅ Now properly calls handleArchive
        >
          📂 Archive
        </button>
      </div>
    </div>
  );
};

export default ClassCard;

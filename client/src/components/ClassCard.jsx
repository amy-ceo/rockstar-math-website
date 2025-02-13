import React from "react";

const ClassCard = ({ classData }) => {
  return (
    <div className="relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Background Image */}
      <img
        src={classData.image}
        alt={classData.title}
        className="w-full h-52 object-cover"
      />


      {/* Title & Description */}
      <div className="p-4">
        <h4 className="text-lg font-semibold">{classData.title}</h4>
        <p className="text-gray-500 text-sm mt-2">{classData.description}</p>
       
      </div>
    </div>
  );
};

export default ClassCard;

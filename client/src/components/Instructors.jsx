import React from "react";
import AnimatedSection from "./AnimatedSection";

function Instructors() {
  const instructors = [
    {
      img: "/images/teacher5.webp",
      name: "Amy G.",
      position: "Entrepreneur",
      description: "Amy is currently working on launching a dating app and starting a micro-school. She also ran a tutoring business while in graduate school.",
    },
    {
      img: "/images/teacher5.png",
      name: "Amy G.",
      position: "Educator",
      description: "Amy has been a math tutor for over 20 years and has also served as a teacher for colleges, universities, and private high schools.",
    },
    {
      img: "/images/teacher4.png",
      name: "Amy G.",
      position: "Researcher",
      description: "Amy worked as a research scientist for Georgia Tech University Research Institute's Air and Space Sensor Division.",
    },
  ];

  return (
    <AnimatedSection direction="right">
      <div className="w-full py-12 px-4 md:px-10 lg:px-20 bg-gray-50 block">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Meet Your Instructor
          </h1>
          <p className="text-gray-600 mt-2">
            Learn from the best in their fields and gain valuable knowledge.
          </p>
        </div>

        {/* ✅ Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((instructor, index) => (
            <div
              key={index}
              className="rounded-lg shadow-lg bg-white overflow-hidden transform transition duration-300 hover:shadow-xl"
            >
              {/* ✅ Image with Fixed Height */}
              <div className="relative">
                <img
                  src={instructor.img}
                  alt={instructor.name}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover"
                />
              </div>

              {/* ✅ Instructor Details */}
              <div className="p-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                  {instructor.name}
                </h2>
                <h3 className="text-yellow-500 italic mb-2 md:mb-3">
                  {instructor.position}
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {instructor.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default Instructors;

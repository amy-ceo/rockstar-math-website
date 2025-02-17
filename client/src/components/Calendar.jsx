import React, { useState } from "react";
import AnimatedSection from "./AnimatedSection";

const Calendar = () => {
  // 🛠 Event Data with Categories
  const eventData = {
    Sunday: [
      { name: "3-6pm: Individual Classes", type: "individual" },
      { name: "7-8pm: Individual Classes", type: "individual" },
      { name: "8-9pm: Common Core Drop-In For Parents", type: "math" },
    ],
    Monday: [
      { name: "3-6pm: Individual Classes", type: "individual" },
      { name: "7-8pm: Middle School Study Group", type: "study" },
      { name: "8-9pm: Trigonometry & Precalculus", type: "math" },
    ],
    Tuesday: [
      { name: "3-6pm: Individual Classes", type: "individual" },
      { name: "7-8pm: Algebra I Study Group", type: "study" },
      { name: "8-9pm: Calculus Drop-In Group (1.5 Hours)", type: "study" },
    ],
    Wednesday: [
      { name: "3-6pm: Individual Classes", type: "individual" },
      { name: "7-8pm: Middle School Study Group", type: "study" },
      { name: "8-9pm: Geometry Study Group", type: "study" },
    ],
    Thursday: [
      { name: "3-6pm: Seasonal Course (TBD)", type: "seasonal" },
      { name: "7-8pm: TBD", type: "seasonal" },
      { name: "8-9pm: TBD", type: "seasonal" },
    ],
  };

  // 🛠 Define Colors for Bullet Points Based on Type
  const bulletColors = {
    individual: "text-blue-500", // 🔵 Individual Classes
    study: "text-purple-500", // 🟣 Study Groups
    math: "text-green-500", // 🟢 Math Courses
    seasonal: "text-yellow-500", // 🟡 Seasonal Courses
    general: "text-gray-500", // ⚪ General Events
  };

  // 🛠 State for Tooltip Visibility
  const [hoveredDay, setHoveredDay] = useState(null);

  return (
    <AnimatedSection direction="top">
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-purple-500 to-indigo-500 shadow-xl rounded-2xl p-10 text-white">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold flex items-center justify-center gap-3">
            <span role="img" aria-label="calendar">📅</span> Interactive Calendar
          </h2>
          <p className="mt-2 text-lg">Plan your learning schedule with ease!</p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-center">
          {Object.keys(eventData).map((day) => (
            <div
              key={day}
              className="relative py-6 px-5 rounded-lg shadow-md bg-white text-gray-900 hover:shadow-lg transition-all cursor-pointer border border-gray-300 font-semibold text-lg"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="block text-xl font-bold">{day}</span>
              {hoveredDay === day && (
                <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm py-3 px-5 rounded-lg shadow-xl opacity-90 animate-fadeIn whitespace-nowrap z-10">
                  <ul className="list-disc list-inside">
                    {eventData[day].map((event, index) => (
                      <li key={index} className={`text-center ${bulletColors[event.type]}`}>
                        {event.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Calendar;

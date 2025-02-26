import React, { useState } from "react";
import AnimatedSection from "./AnimatedSection";

const Calendar = () => {
  // 🛠 Event Data with Categories
  const eventData = {
    Sunday: [
      { name: "3-6pm: Opening Tutoring", type: "individual" },
      { name: "7-8pm: Opening Tutoring", type: "individual" },
      { name: "8-9pm: Common Core", type: "math" },
    ],
    Monday: [
      { name: "3-6pm: Opening Tutoring", type: "individual" },
      { name: "7-8pm: Geometry", type: "study" },
      { name: "8-9pm: PreCal/Trig", type: "math" },
    ],
    Tuesday: [
      { name: "3-6pm: Opening Tutoring", type: "individual" },
      { name: "7-8pm: Algebra I", type: "study" },
      { name: "8-9pm: Calc 1", type: "study" },
    ],
    Wednesday: [
      { name: "3-6pm: Opening Tutoring", type: "individual" },
      { name: "7-8pm: Algebra II", type: "study" },
      { name: "8-9pm: Calc 2", type: "study" },
    ],
    Thursday: [
      { name: "3-6pm: ", type: "seasonal" },
      { name: "7-8pm: ", type: "seasonal" },
      { name: "8-9pm: ", type: "seasonal" },
    ],
    Friday: [
      { name: "3-6pm: ", type: "seasonal" },
      { name: "7-8pm: ", type: "seasonal" },
      { name: "8-9pm: ", type: "seasonal" },
    ],
  };

  // 🛠 Define Colors for Bullet Points Based on Type
  const bulletColors = {
    individual: "text-blue-500", // 🔵 Individual Classes
    study: "text-purple-500", // 🟣 Study Groups
    math: "text-green-500", // 🟢 Common Core Drop-In
    seasonal: "text-yellow-500", // 🟡 To Be Determined (TBD)
  };

  // 🛠 State for Tooltip Visibility
  const [hoveredDay, setHoveredDay] = useState(null);

  return (
    <AnimatedSection direction="top">
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-purple-500 to-indigo-500 shadow-xl rounded-2xl p-8 text-white">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold flex items-center justify-center gap-3">
            <span role="img" aria-label="calendar">📅</span> Interactive Calendar
          </h2>
          <p className="mt-2 text-lg">Plan your learning schedule with ease!</p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
          {Object.keys(eventData).map((day) => (
            <div
              key={day}
              className="relative py-5 px-4 rounded-lg shadow-md bg-white text-gray-900 hover:shadow-lg transition-all cursor-pointer border border-gray-300 font-semibold text-lg"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className="block text-xl font-bold">{day}</span>
              {hoveredDay === day && (
                <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm py-3 px-4 rounded-lg shadow-xl opacity-90 animate-fadeIn whitespace-nowrap z-10">
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

        {/* ✅ Legend Section in 2x2 Grid Format */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md text-gray-900 max-w-lg mx-auto">
  {/* ✅ Moved "Legend" slightly to the left */}
  <h3 className="text-lg font-semibold mb-2 text-left pl-6">Legend</h3> 

  {/* ✅ Kept Grid for bullet points */}
  <div className="grid grid-cols-2 gap-4 text-sm text-center px-6">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
      <span className="text-blue-500">Individual Classes</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-purple-500 rounded-full inline-block"></span>
      <span className="text-purple-500">Group Study</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
      <span className="text-green-500">Common Core Drop-In</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span>
      <span className="text-yellow-500">To Be Determined</span>
    </div>
  </div>
</div>

      </div>
    </AnimatedSection>
  );
};

export default Calendar;

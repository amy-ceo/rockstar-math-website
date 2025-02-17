import React from 'react';
import 'animate.css';

const CalenderSection = () => {
  const schedule = [
    {
      time: "3 - 6 pm",
      days: [
        { name: "Individual Lessons", type: "individual" },
        { name: "Individual Lessons", type: "individual" },
        { name: "Individual Lessons", type: "individual" },
        { name: "Individual Lessons", type: "individual" },
        { name: "Seasonal Course (TBD)", type: "gold" }, // ✅ Updated
      ],
    },
    {
      time: "7 - 8 pm",
      days: [
        { name: "Individual Lessons", type: "individual" },
        { name: "Middle School Study Group", type: "studyGroup" },
        { name: "Algebra I Study Group", type: "studyGroup" },
        { name: "Middle School Study Group", type: "studyGroup" },
        { name: "TBD", type: "gold" }, // ✅ Updated
      ],
    },
    {
      time: "8 - 9 pm",
      days: [
        { name: "Common Core Drop In for Parents", type: "commonCore" },
        { name: "Trigonometry and Precalculus", type: "studyGroup" },
        { name: "Calculus Drop In Group (1.5 hours)", type: "studyGroup" },
        { name: "Geometry Study Group", type: "studyGroup" },
        { name: "TBD", type: "gold" }, // ✅ Updated
      ],
    },
  ];

  // Define colors based on type
  const textColors = {
    individual: "text-blue-500 font-semibold", // 🔵 Individual Lessons
    commonCore: "text-green-500 font-semibold", // 🟢 Common Core
    studyGroup: "text-purple-500 font-semibold", // 🟣 Study Groups
    gold: "text-yellow-500 font-semibold", // 🟡 All of Thursday (Updated)
  };

  return (
    <div className="max-w-full px-10 py-10 animate__animated animate__fadeIn">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-900">  
        Calendar
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-4 text-left text-lg">Time (PST)</th>
              <th className="border  border-black p-4 text-left text-lg">Sunday</th>
              <th className="border  border-black p-4 text-left text-lg">Monday</th>
              <th className="border  border-black p-4 text-left text-lg">Tuesday</th>
              <th className="border  border-black p-4 text-left text-lg">Wednesday</th>
              <th className="border  border-black p-4 text-left text-lg">Thursday</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition">
                <td className="border border-black p-5 font-medium text-gray-700">
                  {row.time}
                </td>
                {row.days.map((day, dayIndex) => (
                  <td key={dayIndex} className="border border-black p-5">
                    <ul className="list-disc list-inside">
                      <li className={`${textColors[day.type]}`}>{day.name}</li>
                    </ul>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalenderSection;

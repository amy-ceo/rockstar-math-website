import React, { useState } from "react";
import { LuArrowUpRight } from "react-icons/lu";
import { TbGeometry, TbMath, TbBusinessplan } from "react-icons/tb";
import { BiAnalyse } from "react-icons/bi";
import { MdOutlineMultilineChart, MdOutlineBarChart } from "react-icons/md";
import { GiStairs } from "react-icons/gi";
import { FaSquareRootAlt } from "react-icons/fa";
import { IoIosStats } from "react-icons/io";
import { RiFunctionLine } from "react-icons/ri";
import AnimatedSection from "./AnimatedSection";
import WaitlistForm from "./WaitlistForm"; // ✅ Import Waitlist Form

// ✅ Courses Array with Tooltip Hover Effects
const courses = [
  { id: "algebra", Icon: FaSquareRootAlt, title: "Algebra 1 Tutoring", link: "/subscription", tooltip: "⭐ Join group tutoring for Algebra I on our subscription page" },
  { id: "trigonometry", Icon: TbGeometry, title: "Algebra II", link: "/subscription", tooltip: "⭐ Join group tutoring for Algebra II on our subscription page" },
  { id: "math-analysis", Icon: BiAnalyse, title: "Calc", link: "/subscription", tooltip: "⭐ Join group tutoring for Calc  on our subscription page" },
  { id: "precalculus", Icon: TbMath, title: "Geometry Tutoring", link: "/subscription", tooltip: "⭐ Join group tutoring for Geometry on our subscription page" },
  { id: "business-calculus", Icon: TbBusinessplan, title: "Common Core For Parents", link: "/subscription", tooltip: "⭐ oin group tutoring for Common Core For Parents on our subscription page" },
  { id: "calculus-1", Icon: TbMath, title: "PreCalc and Trig", link: "/subscription" ,tooltip: "⭐ Join group tutoring for PreCalc and Trig on our subscription page" },
  { id: "calculus-2", Icon: RiFunctionLine, title: "Sacred Geometry (10+)", link: "/courses/calculus-2" },
  { id: "calculus-3", Icon: GiStairs, title: "Euclid Elements (10+)", link: "/courses/calculus-3" },
  { id: "probability", Icon: IoIosStats, title: "Number Ninjas (7-12) ", link: "/courses/probability" },
  { id: "discrete-math", Icon: MdOutlineBarChart, title: "Misinformation Detective (10+)", link: "/courses/discrete-math" },
  { id: "linear-algebra", Icon: MdOutlineMultilineChart, title: "Math For Trades (14-18) ", link: "/courses/linear-algebra" },
  { id: "differential-equations", Icon: RiFunctionLine, title: "Differential Equations", link: "/courses/differential-equations" },
];

// ✅ Courses that should open the Waitlist Form instead of redirecting
const waitlistCourses = [, "calculus-2", "calculus-3", "probability", "discrete-math", "linear-algebra", "differential-equations"];

function RelatedCourses() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [hoveredCourse, setHoveredCourse] = useState(null);

  const handleCourseClick = (course) => {
    console.log("Clicked on:", course.title); // Debugging Tap Issue
    if (waitlistCourses.includes(course.id)) {
      setSelectedCourse(course.title);
      setIsFormModalOpen(true);
    } else {
      window.location.href = course.link;
    }
  };

  return (
    <div className="w-full py-10 px-4 md:px-10 lg:px-20 bg-gray-50 block">
      <AnimatedSection direction="left">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Related Courses</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of top-rated courses to enhance your learning.
          </p>
        </div>

        {/* ✅ Responsive Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {courses.map((course, index) => (
            <div
              key={index}
              onClick={() => handleCourseClick(course)}
              onTouchStart={() => handleCourseClick(course)} // ✅ Fix for Mobile Taps
              onMouseEnter={() => setHoveredCourse(course.id)}
              onMouseLeave={() => setHoveredCourse(null)}
              className="relative cursor-pointer flex items-center gap-4 p-4 rounded-lg shadow-md bg-white border border-gray-200 transition-transform hover:shadow-lg hover:scale-105"
            >
              <div className="p-3 bg-gray-100 rounded-full text-deepBlue text-4xl">
                {course.Icon && <course.Icon />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800">
                  {course.title}
                </h3>
              </div>
              <div className="text-deepBlue text-3xl">
                <LuArrowUpRight />
              </div>

              {/* ✅ Mobile-Friendly Tooltip */}
              {hoveredCourse === course.id && course.tooltip && (
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-auto max-w-xs bg-gray-900 text-white text-sm rounded-md shadow-lg p-2 z-50 text-center">
               {course.tooltip}
             </div>
             
              )}
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ✅ Waitlist Form (Ensure it closes properly) */}
      {isFormModalOpen && <WaitlistForm setIsFormModalOpen={setIsFormModalOpen} />}
    </div>
  );
}


export default RelatedCourses;

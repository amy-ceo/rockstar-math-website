import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TbGeometry, TbMath, TbBusinessplan } from "react-icons/tb";
import { LuArrowUpRight } from "react-icons/lu";
import { BiAnalyse } from "react-icons/bi";
import { MdOutlineMultilineChart, MdOutlineBarChart } from "react-icons/md";
import { GiStairs } from "react-icons/gi";
import { FaSquareRootAlt } from "react-icons/fa";
import { IoIosStats } from "react-icons/io";
import { RiFunctionLine } from "react-icons/ri";
import AnimatedSection from "./AnimatedSection";
import WaitlistForm from "./WaitlistForm"; // ✅ Import the Waitlist Form

// ✅ Courses Array with Separate Links
const courses = [
  { id: "algebra", Icon: FaSquareRootAlt, title: "Algebra 1 Tutoring", link: "/subscription" },
  { id: "trigonometry", Icon: TbGeometry, title: "Calc 1 Tutoring", link: "/subscription" },
  { id: "math-analysis", Icon: BiAnalyse, title: "Pre Calc and Trig Tutoring", link: "/subscription" },
  { id: "precalculus", Icon: TbMath, title: "Geometry Tutoring", link: "/subscription" },
  { id: "business-calculus", Icon: TbBusinessplan, title: "Common Core for Parents", link: "/subscription" },
  { id: "calculus-1", Icon: TbMath, title: "Calculus 1", link: "/courses/calculus-1" },
  { id: "calculus-2", Icon: RiFunctionLine, title: "Calculus 2", link: "/courses/calculus-2" },
  { id: "calculus-3", Icon: GiStairs, title: "Calculus 3 (Multivariable)", link: "/courses/calculus-3" },
  { id: "probability", Icon: IoIosStats, title: "Probability and Statistics", link: "/courses/probability" },
  { id: "discrete-math", Icon: MdOutlineBarChart, title: "Discrete Math", link: "/courses/discrete-math" },
  { id: "linear-algebra", Icon: MdOutlineMultilineChart, title: "Linear Algebra", link: "/courses/linear-algebra" },
  { id: "differential-equations", Icon: RiFunctionLine, title: "Differential Equations", link: "/courses/differential-equations" },
];

// ✅ List of courses that should open the Waitlist Form
const waitlistCourses = ["calculus-1", "calculus-2", "calculus-3", "probability", "discrete-math", "linear-algebra", "differential-equations"];

function RelatedCourses() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleCourseClick = (course) => {
    if (waitlistCourses.includes(course.id)) {
      // ✅ Open Waitlist Form for specific courses
      setSelectedCourse(course.title);
      setIsFormModalOpen(true);
    } else {
      // ✅ Redirect to the course link if it's not in the waitlist courses
      window.location.href = course.link;
    }
  };

  return (
    <div className="w-full py-10 px-4 md:px-10 lg:px-20 bg-gray-50">
      <AnimatedSection direction="left">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Related Courses</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of top-rated courses to enhance your learning.
          </p>
        </div>

        {/* ✅ Map Over Courses with Separate Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div
              key={index}
              onClick={() => handleCourseClick(course)}
              className="cursor-pointer flex items-center gap-4 p-4 rounded-lg shadow-md bg-white border border-gray-200 transition-transform hover:shadow-lg hover:scale-105"
            >
              <div className="p-3 bg-gray-100 rounded-full text-deepBlue text-4xl">
                {course.Icon && <course.Icon />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800">{course.title}</h3>
              </div>
              <div className="text-deepBlue text-3xl">
                <LuArrowUpRight />
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ✅ Show Waitlist Form when triggered */}
      {isFormModalOpen && <WaitlistForm setIsFormModalOpen={setIsFormModalOpen} />}
    </div>
  );
}

export default RelatedCourses;

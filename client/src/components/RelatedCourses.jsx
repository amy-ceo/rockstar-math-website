import React from "react";
import { TbGeometry, TbMath, TbBusinessplan } from "react-icons/tb";
import { LuArrowUpRight } from "react-icons/lu";
import { BiAnalyse } from "react-icons/bi";
import { MdOutlineMultilineChart, MdOutlineBarChart } from "react-icons/md";
import { GiStairs } from "react-icons/gi";
import { FaSquareRootAlt } from "react-icons/fa";
import { IoIosStats } from "react-icons/io";
import { RiFunctionLine } from "react-icons/ri";
import AnimatedSection from "./AnimatedSection";

function RelatedCourses() {
 const courses = [
    { Icon: FaSquareRootAlt, title: "Algebra I & II", link: "https://www.youtube.com/watch?v=8pLuWu9w_4w" },
    { Icon: TbGeometry, title: "Trigonometry (Pre-Calculus)", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: BiAnalyse, title: "Math Analysis", link: "https://www.youtube.com/watch?v=KT8ZHvdLL1s&t=17s" },
    { Icon: TbMath, title: "Math Analysis (Pre-Calculus)", link: "https://www.youtube.com/watch?v=u7s7Ufl_Y7U" },
    { Icon: TbBusinessplan, title: "Business Calculus", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: TbMath, title: "Calculus 1", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: RiFunctionLine, title: "Calculus 2", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: GiStairs, title: "Calculus 3 (Multivariable)", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: IoIosStats, title: "Probability and Statistics", link: "https://www.youtube.com/watch?v=cQDiIsay9r0" },
    { Icon: MdOutlineBarChart, title: "Discrete Math", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
    { Icon: MdOutlineMultilineChart, title: "Linear Algebra", link: "https://www.youtube.com/watch?v=ck9yuOupO4Y" },
    { Icon: RiFunctionLine, title: "Differential Equations", link: "https://www.youtube.com/@RockstarMathTutoring/videos" },
  ];

  return (
    <div className="w-full py-10 px-4 md:px-10 lg:px-20 bg-gray-50">
      <AnimatedSection direction="left">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Related Courses</h1>
        <p className="text-gray-600 mt-2">
          Browse our collection of top-rated courses to enhance your learning.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <a
            key={index}
            href={course.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-lg shadow-md bg-white border border-gray-200 transition-transform hover:shadow-lg hover:scale-105"
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
          </a>
        ))}
      </div>
    </AnimatedSection>
    </div>
  );
}

export default RelatedCourses;

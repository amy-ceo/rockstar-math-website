import React from "react";
import { useParams } from "react-router-dom";

const courseHeadings = {
  algebra: "Mastering Algebra I & II",
  trigonometry: "Understanding Trigonometry (Pre-Calculus)",
  "math-analysis": "Exploring Math Analysis",
  precalculus: "Fundamentals of Pre-Calculus",
  "business-calculus": "Introduction to Business Calculus",
  "calculus-1": "Basics of Calculus 1",
  "calculus-2": "Advanced Concepts in Calculus 2",
  "calculus-3": "Multivariable Calculus Explained",
  probability: "Probability & Statistics Essentials",
  "discrete-math": "Understanding Discrete Mathematics",
  "linear-algebra": "Introduction to Linear Algebra",
  "differential-equations": "Solving Differential Equations",
};

function CourseDetail() {
  const { id } = useParams(); // Get the dynamic ID from the URL
  const heading = courseHeadings[id] || "Course Details"; // Default title if ID not found

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900">{heading}</h1>
    </div>
  );
}

export default CourseDetail;

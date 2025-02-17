import React, { useEffect, useState, Suspense, lazy } from "react";
import "animate.css";

// ✅ Lazy Load Components
const Hero = lazy(() => import("../components/Hero"));
const PopTopic = lazy(() => import("../components/PopTopic"));
const RelatedCourses = lazy(() => import("../components/RelatedCourses"));
const Instructors = lazy(() => import("../components/Instructors"));
const Milestones = lazy(() => import("../components/Milestones"));
const Calendar = lazy(() => import("../components/Calendar"));
const StudentFeedback = lazy(() => import("../components/StudentFeedback"));
const JoinOurCommunity = lazy(() => import("../components/JoinOurCommunity"));
const Newsletter = lazy(() => import("./Newsletter"));

function HomePage() {


  return (
    <>
  

      {/* ✅ Lazy Loaded Components */}
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Hero Section...</div>}>
        <Hero />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Popular Topics...</div>}>
        <PopTopic />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Related Courses...</div>}>
        <RelatedCourses />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Instructors...</div>}>
        <Instructors />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Milestones...</div>}>
        <Milestones />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Calendar...</div>}>
        <Calendar />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Student Feedback...</div>}>
        <StudentFeedback />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Community Section...</div>}>
        <JoinOurCommunity />
      </Suspense>
    </>
  );
}

export default HomePage;

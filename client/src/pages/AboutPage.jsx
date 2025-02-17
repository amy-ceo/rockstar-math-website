import React, { Suspense, lazy } from "react";
import { FaVideo, FaCommentDots, FaLaptop, FaEnvelope } from "react-icons/fa";
import { NavLink } from "react-router-dom";

// Lazy Load Components
const AboutBanner = lazy(() => import("../components/banners/AboutBanner"));
const AnimatedSection = lazy(() => import("../components/AnimatedSection"));

function AboutPage() {
  const aboutItems = [
    {
      image: "/images/about1.png",
      title: "The Language of Math",
      description:
        "Do you know how to read 3x +4(x+2) outloud? It is okay, most people don't.Math is a language, and your teacher is speaking it. You should too.",
    },
    {
      image: "/images/about2.png",
      title: "The Reasoning to each step ",
      description:
        "Often I would ask my students why they took the Step they did and they would immediately think they made a mistake. We are trained in school to get to the right answer. The real goal is to understand why we are taking each step when we solve a problem",
    },
    {
      image: "/images/about3.png",
      title: "How to Learn Math ",
      description:
        "I can write a paper the night before it is due I have heard so many students claim. This mindset is applied to math when people cram before an exam. You wouldn't learn your lines the night before a play, or a sport the night before a game. Math is a skill like sports and music and I provide my students with coaching on how to train their brain.",
    },
  ];

  const stats = [
    { number: 5, text: "years of teaching at CSU campuses." },
    { number: 20, text: "years of tutoring 1-1" },
    { number: "10,000", text: "hours of teaching/tutoring" },
    { number: "2+", text: "degrees Taught at 3 different colleges" },
    { number: 2, text: "Homeschooling 2 Kids For 2 Years" },
    { number: 1, text: "Patent Pending For Algorithm" },
    { number: 30, text: "Years Video Games & Skateboarding" },
    { number: 3, text: "Years As A Research Scientist" },
  ];

  const additionalInfo = [
    { icon: <FaVideo size={40} />, text: "Private Tutoring" },
    { icon: <FaCommentDots size={40} />, text: "Group Tutoring" },
    { icon: <FaLaptop size={40} />, text: "Digital Courses " },
    { icon: <FaEnvelope size={40} />, text: "Live Courses" },
  ];

  return (
    <>
      <Suspense fallback={<div className="text-center text-gray-500 py-10">Loading...</div>}>
        <AboutBanner />
      </Suspense>

      <div className="bg-gray-50 py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-gray-800">
            <span className="relative inline-block">
              <span className="absolute inset-0 transform -skew-x-6 rounded-md"></span>
              <span className="relative z-10">The Way Learning Math Should Be…</span>
            </span>
          </h2>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            I started RockstarMath 10 years ago with a simple but powerful idea: give students of
            all ages the easiest to follow and most understandable math courses imaginable. After
            attending too many college and graduate math classes that left me dazed and confused by
            unexplained theorems and missing steps, I knew there had to be a better way.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Animation...</div>}>
        <AnimatedSection direction="left">
          <div className="flex flex-col justify-center items-center py-10 bg-gray-50">
            <h2 className="text-3xl font-bold text-black text-center relative inline-block">
              <span className="relative z-10">That’s why I…</span>
            </h2>

            <div className="flex flex-wrap justify-center gap-8 mt-12">
              {aboutItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col bg-white shadow-md border border-gray-200 rounded-lg w-80 md:w-96 hover:shadow-lg transition-transform duration-300 transform hover:-translate-y-2"
                >
                  <div className="h-56 m-3 overflow-hidden rounded-lg relative">
                    <img src={item.image} loading="lazy" alt="card-image" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h6 className="mb-2 text-gray-800 text-xl font-semibold hover:text-deepBlue transition duration-300">
                      {item.title}
                    </h6>
                    <p className="text-gray-600 leading-relaxed font-light">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </Suspense>

      <div className="flex flex-col items-center bg-gray-50 py-14">
        <h2 className="text-gray-800 text-center text-3xl font-bold">
          A few vital statistics about Amy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mt-12 px-6 lg:px-20">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center py-8 px-6">
              <span className="p-16 font-bold border text-4xl border-deepBlue text-deepBlue rounded-full w-24 h-24 flex items-center justify-center">
                {stat.number}
              </span>
              <span className="text-gray-600 text-lg font-medium mt-4">{stat.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center py-14 bg-gray-50">
        <h2 className="text-gray-800 text-center text-3xl font-bold">
          Join over <span className="text-deepBlue">32,000</span> other students achieving success in their math courses
        </h2>
        <p className="text-gray-600 text-center text-xl max-w-4xl mt-4 leading-relaxed">
          Whether you’re learning it for the first time or simply want a refresher, you’ll find all
          the tools you need to reach the top of your class with RockstarMath.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 px-6 lg:px-20">
          {additionalInfo.map((info, index) => (
            <div key={index} className="flex flex-col items-center p-6 transition-all duration-300">
              <div className="p-6 rounded-full bg-deepBlue text-white flex items-center justify-center w-20 h-20 shadow-md mb-4">
                {info.icon}
              </div>
              <span className="text-gray-800 text-lg font-semibold text-center">{info.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AboutPage;

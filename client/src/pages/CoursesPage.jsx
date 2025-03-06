import React, { useState, Suspense, lazy } from 'react'
import { IoMdPlay, IoMdClose } from 'react-icons/io'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Image1 from '../assets/math-image.jpg'
import Image2 from '../assets/math-image2.jpg'
import Image3 from '../assets/math-image3.jpg'
import Image4 from '../assets/math-image4.jpg'
import Image5 from '../assets/math-image5.jpg'
import Image6 from '../assets/math-image6.jpg'
import Image7 from '../assets/math-image7.jpg'
import Image8 from '../assets/math-image8.jpg'
import Image9 from '../assets/math-image9.jpg'





// Lazy Load Components
const WaitlistForm = lazy(() => import('../components/WaitlistForm'))

const CoursesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  // ✅ All Courses Data
  const newCourses = [
    {
      courseName: 'AP CALC Bootcamp',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: '/images/1.jpg',
      desc: 'Get a head start on your AP Calculus exam! Our bootcamp is packed with expert strategies, practice tests, and everything you need to succeed.',
    },
    {
      courseName: 'Group Tutoring Sessions',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: '/images/2.jpg',
      desc: 'Team up with fellow math enthusiasts! Our group sessions are a great way to learn, share, and grow with others in a fun and engaging environment.',
    },
    {
      courseName: 'Private Tutoring Sessions',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: '/images/3.jpg',
      desc: 'Experience customized learning with our private sessions. Whether you need help catching up or want to excel, our tutors are here to guide you every step of the way.',
    },
  ]

  // const courses = [

  //   // {
  //   //   courseName: 'Mathematics Mastery',
  //   //   videoUrl: '/videos/video.mp4',
  //   //   thumbnailUrl: '/images/teacher1.png',
  //   //   points: [
  //   //     'Learn from basic algebra to advanced calculus.',
  //   //     'Expert instructors with years of experience.',
  //   //     'Interactive lessons with real-world applications.',
  //   //     'Practice tests to track your progress.',
  //   //   ],
  //   // },
  //   // {
  //   //   courseName: 'Physics for Beginners',
  //   //   videoUrl: '/videos/video.mp4',
  //   //   thumbnailUrl: '/images/teacher2.png',
  //   //   points: [
  //   //     'Simplified concepts for easy understanding.',
  //   //     'Hands-on experiments to solidify learning.',
  //   //     'Comprehensive coverage of Newtonian mechanics.',
  //   //     'Visual aids for enhanced grasp of topics.',
  //   //   ],
  //   // },
  //   {
  //     courseName: 'Sacred Geometry (10+)',
  //     videoUrl: '/videos/video.mp4',
  //     thumbnailUrl: Image1,
  //     points: [
  //       'Explore the mathematical beauty behind nature’s patterns and ancient symbols.',
  //       'Learn about the Golden Ratio, Fibonacci sequence, and their real-world applications.',
  //       'Discover the significance of geometric shapes in art, architecture, and spirituality.',
  //       'Engage in hands-on activities to create and analyze sacred geometric designs.',
  //     ],
  //   },
  //   {
  //     courseName: 'Euclid’s Elements (10+)',
  //     videoUrl: '/videos/video.mp4',
  //     thumbnailUrl: Image2,
  //     points: [
  //       'Dive into the foundations of geometry as taught by the ancient mathematician Euclid.',
  //       'Understand the logic behind axioms, theorems, and geometric proofs.',
  //       'Explore how Euclidean principles shape modern mathematics and engineering.',
  //       'Solve interactive problems inspired by Euclid’s timeless work.',
  //     ],
  //   },
  //   {
  //     courseName: 'Number Ninjas (7-12)',
  //     videoUrl: '/videos/video.mp4',
  //     thumbnailUrl: Image3,
  //     points: [
  //       'Master math fundamentals with fun, engaging challenges and games.',
  //       'Develop problem-solving skills through real-world math puzzles.',
  //       'Strengthen arithmetic, fractions, and algebraic thinking with hands-on activities.',
  //       'Earn ninja ranks as you progress through different levels of math mastery.',
  //     ],
  //   },
  //   {
  //     courseName: 'Misinformation Detective (10+)',
  //     videoUrl: '/videos/video.mp4',
  //     thumbnailUrl: Image4,
  //     points: [
  //       'Learn how to identify misleading statistics and debunk math-related myths.',
  //       'Develop critical thinking skills to analyze data and recognize false claims.',
  //       'Explore real-world examples of misinformation in media, finance, and science.',
  //       'Use mathematical reasoning to uncover the truth behind deceptive numbers.',
  //     ],
  //   },
  //   {
  //     courseName: 'Math For Trades (14-18)',
  //     videoUrl: '/videos/video.mp4',
  //     thumbnailUrl: Image5,
  //     points: [
  //       'Apply practical math skills for careers in construction, carpentry, and other trades.',
  //       'Learn measurements, angles, and ratios used in real-world projects.',
  //       'Understand budgeting, material estimation, and blueprint reading.',
  //       'Gain confidence in using math for hands-on problem-solving in skilled trades.',
  //     ],
  //   },
  // ]

  // ✅ Open Video Modal

  const courses = [
    {
      courseName: 'Sacred Geometry (10+)', // LEFT
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image1,
      points: [
        'Explore the mathematical beauty behind nature’s patterns and ancient symbols.',
        'Learn about the Golden Ratio, Fibonacci sequence, and their real-world applications.',
        'Discover the significance of geometric shapes in art, architecture, and spirituality.',
        'Engage in hands-on activities to create and analyze sacred geometric designs.',
      ],
    },
    {
      courseName: 'Euclid’s Elements (10+)', // RIGHT
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image2,
      points: [
        'Dive into the foundations of geometry as taught by the ancient mathematician Euclid.',
        'Understand the logic behind axioms, theorems, and geometric proofs.',
        'Explore how Euclidean principles shape modern mathematics and engineering.',
        'Solve interactive problems inspired by Euclid’s timeless work.',
      ],
    },
    {
      courseName: 'Number Ninjas (7-12)', // LEFT
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image3,
      points: [
        'Master math fundamentals with fun, engaging challenges and games.',
        'Develop problem-solving skills through real-world math puzzles.',
        'Strengthen arithmetic, fractions, and algebraic thinking with hands-on activities.',
        'Earn ninja ranks as you progress through different levels of math mastery.',
      ],
    },
    {
      courseName: 'Misinformation Detective (10+)', // RIGHT
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image4,
      points: [
        'Learn how to identify misleading statistics and debunk math-related myths.',
        'Develop critical thinking skills to analyze data and recognize false claims.',
        'Explore real-world examples of misinformation in media, finance, and science.',
        'Use mathematical reasoning to uncover the truth behind deceptive numbers.',
      ],
    },
    {
      courseName: 'Math For Trades (14-18)', // LEFT
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image5,
      points: [
        'Apply practical math skills for careers in construction, carpentry, and other trades.',
        'Learn measurements, angles, and ratios used in real-world projects.',
        'Understand budgeting, material estimation, and blueprint reading.',
        'Gain confidence in using math for hands-on problem-solving in skilled trades.',
      ],
    },
  ]

  console.log(
    courses.map((c, i) => ({
      index: i,
      name: c.courseName,
      classApplied: i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row',
    })),
  )

  // ✅ Spring Break Courses Data
  const springBreakCourses = [
    {
      courseName: 'Rubik’s Cube Mastery',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image6,
      ageGroup: 'Ages 10+',
      price: '$125',
      duration: '5 Days (45-60 min)',
      description: 'Learn to solve a Rubik Cube together. Materials needed: Rubik’s Cube.',
    },
    {
      courseName: 'Number Ninja (Ages 6-9)',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image7,
      ageGroup: 'Ages 6-9',
      price: '$125',
      duration: '5 Days (45-60 min)',
      description:
        'Master Mental Math! Topics: Additions up to 100, Multiplication up to 10, Division & Fractions.',
    },
    {
      courseName: 'Number Ninja (Ages 9-11)',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image8,
      ageGroup: 'Ages 9-11',
      price: '$125',
      duration: '5 Days (45-60 min)',
      description: 'Master Mental Math! Topics: Decimals, Division, and Fractions mastered!',
    },
    {
      courseName: 'Private Tutoring (Spring Break)',
      ageGroup: 'Any Age',
      videoUrl: '/videos/video.mp4',
      thumbnailUrl: Image9,
      price: '$225 (normally $275)',
      duration: '5 Days (30 min each)',
      description: 'Need to catch up on math over spring break? Book 5 sessions and save $50!',
    },
  ]

  const openModal = (videoUrl) => {
    setCurrentVideo(videoUrl)
    setIsModalOpen(true)
  }

  // ✅ Close Video Modal
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentVideo('')
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="py-32 bg-gray-50">
        {/* ✅ Spring Break Banner */}
        <div className="bg-blue-600 text-white text-center py-6">
          <h1 className="text-4xl font-bold">🌸 Spring Break 2025 🌸</h1>
          <p className="text-lg mt-2">March 21 - April 4th | Oakland, CA</p>
          <p className="mt-1">5-Day Courses (45-60 min per session) | Min 3 Students Required</p>
        </div>

        {/* ✅ Spring Break Courses Section */}
        {/* ✅ Spring Break Courses Section (Updated Layout) */}
        <div className="py-16 bg-gray-50">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Spring Break Courses
          </h2>
          <div className="max-w-6xl mx-auto flex flex-col gap-16 ">
            {springBreakCourses.map((course, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center gap-10 ${
                  index % 2 !== 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* ✅ Image Section */}
                <div className="flex-1 relative rounded-lg overflow-hidden h-[300px] md:h-[350px]">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.courseName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-deepBlue p-4 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => openModal(course.videoUrl)}
                  >
                    <IoMdPlay className="text-white text-md" />
                  </div>
                </div>

                {/* ✅ Course Info Section */}
                <div className="flex-1 p-6 rounded-lg flex flex-col justify-between h-full">
                  <h3 className="text-3xl font-bold text-deepBlue mb-4">{course.courseName}</h3>
                  <p className="text-gray-600">{course.ageGroup}</p>
                  <p className="text-gray-500">{course.price}</p>
                  <p className="text-gray-500">{course.duration}</p>
                  <p className="mt-4 text-lg">{course.description}</p>

                  {/* ✅ Join Waitlist Button */}
                  <button
                    onClick={() => setIsFormModalOpen(true)}
                    className="max-w-48 mt-6 bg-deepBlue text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-600 transition duration-300"
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12 mt-24">
          <h1 className="text-2xl font-extrabold text-deepBlue leading-tight">
            Enthusiastic & Action-Oriented
          </h1>
          <h2 className="text-3xl font-semibold text-deepBlue mt-2">
            Ready to Take Your Math Skills to the Next Level?
          </h2>
          <p className="mt-2 text-lg md:text-xl text-deepBlue leading-relaxed">
            We’re thrilled to announce exciting new additions to our courses page! Whether you’re
            prepping for a big exam or looking for personalized support, we’ve got you covered.
          </p>
        </div>

        {/* New Courses Section */}
        <div className="flex flex-col gap-16 px-5 xl:px-20 py-5">
          {newCourses.map((course, index) => (
            <div
              key={index}
              className={`flex flex-col md:flex-row items-center gap-10 ${
                index % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Course Info */}
              <div className="flex-1 p-6 rounded-lg flex flex-col justify-between h-full">
                <h2 className="text-3xl font-bold text-deepBlue mb-6">{course.courseName}</h2>
                <p>{course.desc}</p>
                <Link
                  to="/services"
                  className="text-center max-w-48 mt-6 bg-deepBlue text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-600 transition duration-300"
                >
                  Sign Up Now
                </Link>
              </div>

              {/* Video Section */}
              <div className="flex-1 relative rounded-lg overflow-hidden h-[330px]">
                <img
                  src={course.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-deepBlue p-4 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => openModal(course.videoUrl)}
                >
                  <IoMdPlay className="text-white text-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
   {/*
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40">
            <div className="rounded-xl max-w-4xl w-full relative">
              <video src={currentVideo} controls autoPlay className="w-full h-auto rounded-lg" />
            </div>
            <button
              onClick={closeModal}
              className="fixed top-4 right-4 bg-deepBlue text-white p-3 rounded-full hover:bg-sky-600 transition-all z-50"
            >
              <IoMdClose className="text-xl" />
            </button>
          </div>
        )} */}

        {/* Advanced Courses Section */}
        <div className="pt-10 pb-32 bg-gray-50">
          {/* <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-2xl font-extrabold text-deepBlue leading-tight">Introduction to Physics</h1>
            <h2 className="text-5xl font-semibold text-deepBlue mt-4">Physics Made Easy</h2>
            <p className="mt-6 text-lg md:text-xl text-deepBlue leading-relaxed">
              Learn physics essentials — Simplify complex topics — Empower your learning journey.
            </p>
          </div> */}

          {/* Courses List */}
          <div className="flex flex-col gap-16 px-5 xl:px-20">
            {courses.map((course, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } items-center gap-10`}
              >
                {/* ✅ Course Info Section (Left) */}
                <div className="flex-1 p-6 rounded-lg flex flex-col justify-between h-full">
                  <h2 className="text-3xl font-bold text-deepBlue mb-6">{course.courseName}</h2>
                  <ul className="list-disc pl-5 text-lg text-deepBlue space-y-3">
                    {course.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setIsFormModalOpen(true)}
                    className="max-w-48 mt-6 bg-deepBlue text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-600 transition duration-300"
                  >
                    Join The Waitlist
                  </button>
                </div>

                {/* ✅ Image Section (Right Side) */}
                <div className="flex-1 relative rounded-lg overflow-hidden h-[330px]">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.courseName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-deepBlue p-4 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => openModal(course.videoUrl)}
                  >
                    <IoMdPlay className="text-white text-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Waitlist Form Popup (Lazy Loaded) */}
      {isFormModalOpen && (
        <Suspense
          fallback={<div className="text-center py-10 text-gray-500">Loading Waitlist Form...</div>}
        >
          <WaitlistForm setIsFormModalOpen={setIsFormModalOpen} />
        </Suspense>
      )}
    </>
  )
}

export default CoursesPage

import React, { useState } from 'react';
import { IoMdStar, IoMdPlay, IoMdClose } from 'react-icons/io';
import AnimatedSection from './AnimatedSection';

function Reviews() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState("");

    const reviews = [
        {
            date: "March 10, 2024",
            stars: 5,
            profilePic: "/images/feedback_images/1.jpg",
            name: "Student",
            details: "Amy worked with all 3 of my very different kids, and I would actually hear them laughing during math tutoring! Each of them was ahead of their class and comfortable with their math courses",
            videoUrl: "/videos/video.mp4",
            position: "Math student",
            thumbnailUrl: "/images/teacher1.png"
        },
        {
            date: "March 15, 2024",
            stars: 4,
            profilePic: "/images/feedback_images/2.jpg",
            name: "High School Student",
            details: "You are literally the best tutor ever.  I wouldn't have graduated without you",
            videoUrl: "/videos/video.mp4",
            position: "Math student",
            thumbnailUrl: "/images/teacher2.png"
        }
    ];

    const textOnlyReviews = [
        {
            date: "March 18, 2024",
            stars: 5,
            profilePic: "/images/feedback_images/3.jpg",
            name: "High School Physics Teacher ",
            details: "Tiana went from eyes glossed over to sitting in the front of the class and raising her hand with confidence since working with you.  Thank you",
            position: "Physics student"
        },
        {
            date: "March 20, 2024",
            stars: 4,
            profilePic: "/images/feedback_images/4.jpg",
            name: "College Student",
            details: "You are the most approachable teacher I have ever had, I felt so comfortable asking questions in your class.",
            position: "Chemistry student"
        },
        {
            date: "March 20, 2024",
            stars: 4,
            profilePic: "/images/feedback_images/6.jpg",
            name: "Returning Adult, College Student",
            details: "I would not have passed this class without you.  Thank you.",
            position: "Chemistry student"
        },
      
    ];

    const openModal = (videoUrl) => {
        setCurrentVideo(videoUrl);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentVideo("");
    };

    const closeModalOnBackdrop = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    return (
<div className="py-14 bg-gray-50">
    {/* Header Section */}
    <div className="text-center py-8 bg-gray-50">
    {/* Main Heading */}
    <h1 className="text-3xl font-extrabold text-black leading-tight">
        900+ Reviews on Shopper Approved 150+ Reviews on Facebook
    </h1>
    {/* Subheading */}
    <p className="mt-4 text-xl text-black font-medium">
        Average <span className="text-black">5-Star</span> Rating
    </p>
</div>

    {/* Reviews Section */}
    <AnimatedSection direction='bottom'>
    <div className="flex flex-wrap gap-8 justify-center px-5 xl:px-20">
  {reviews.map((review, index) => (
    <div
      key={index}
      className=" py-11 w-full flex flex-col md:flex-row items-center rounded-xl  overflow-hidden transition-transform transform hover:scale-105"
    >
      {/* Text Content */}
      <div className="p-6 md:w-2/3">
        {/* Date */}
        <div className="text-sm text-gray-400">{review.date}</div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 my-2">
          {Array.from({ length: review.stars }).map((_, i) => (
            <IoMdStar key={i} className="text-yellow-500" />
          ))}
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={review.profilePic}
            alt={`${review.name}'s profile`}
            className="w-14 h-14 rounded-full border-2 border-blue-500"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{review.name}</h2>
            <p className="text-sm text-gray-500">{review.position}</p>
          </div>
        </div>

        {/* Review Details */}
        <p className="text-gray-700 text-base leading-relaxed">
          {review.details}
        </p>
      </div>

      {/* Thumbnail with Play Button */}
      <div className="relative group md:w-1/3">
        <img
          src={review.thumbnailUrl}
          alt="Review thumbnail"
          className="w-full h-fit object-cover"
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 p-4 rounded-full shadow-md cursor-pointer transition-transform group-hover:scale-110"
          onClick={() => openModal(review.videoUrl)}
        >
          <IoMdPlay className="text-white text-md" />
        </div>
      </div>
    </div>
  ))}
</div>
</AnimatedSection>
<div className="flex flex-wrap gap-8 justify-start px-5 xl:px-20 bg-slate-200 py-20">

{textOnlyReviews.map((review,index)=>(
<div className="p-6 md:w-2/3" key={index}>
        {/* Date */}
        <div className="text-sm text-gray-400">{review.date}</div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 my-2">
          {Array.from({ length: review.stars }).map((_, i) => (
            <IoMdStar key={i} className="text-yellow-500" />
          ))}
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={review.profilePic}
            alt={`${review.name}'s profile`}
            className="w-14 h-14 rounded-full border-2 border-blue-500"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{review.name}</h2>
            <p className="text-sm text-gray-500">{review.position}</p>
          </div>
        </div>

        {/* Review Details */}
        <p className="text-gray-700 text-base leading-relaxed">
          {review.details}
        </p>
      </div>
))}
      </div>

    {/* Modal for Video Playback */}
    {isModalOpen && (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40"
            onClick={closeModalOnBackdrop}
        >
            <div className="rounded-lg shadow-lg max-w-4xl w-full relative">
                <video
                    src={currentVideo}
                    controls
                    className="w-full h-auto rounded-lg"
                />
            </div>
        </div>
    )}

    {isModalOpen && (
        <button
            onClick={closeModal}
            className="fixed top-4 right-4 bg-yellow-400 text-white p-3 rounded-full shadow-lg hover:bg-yellow-500 transition-all z-50"
        >
            <IoMdClose className="text-2xl" />
        </button>
    )}
</div>

    );
}

export default Reviews;

import React, { useState } from "react";
import { IoMdStar, IoMdClose, IoMdPlay } from "react-icons/io";
import 'animate.css';
import AnimatedSection from "./AnimatedSection";
import { Link } from "react-router-dom";

function PopTopic() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState("");

    // Sample data
    const topics = [
        {
            title: "Algebra I & II",
            thumbnail: "/images/teacher1.png",
            videoUrl: "/videos/video.mp4",
            description: "Build a solid foundation in algebra with lessons for beginners.",
            rating: 4.8,
            redirectLink: "https://www.youtube.com/watch?v=8pLuWu9w_4w", // ✅ Custom Link
        },
        {
            title: "Calculus Basics",
            thumbnail: "/images/teacher2.png",
            videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_3840_2160_30fps.mp4",
            description: "Learn the fundamental concepts of calculus.",
            rating: 4.9,
            redirectLink: "https://www.youtube.com/@RockstarMathTutoring/videos", // ✅ Custom Link
        },
        {
            title: "Algebra I & II",
            thumbnail: "/images/teacher3.png",
            videoUrl: "/videos/video.mp4",
            description: "Build a solid foundation in algebra with lessons for beginners.",
            rating: 4.8,
            redirectLink: "https://www.youtube.com/watch?v=8pLuWu9w_4w", // ✅ Custom Link
        },
        {
            title: "Calculus Basics",
            thumbnail: "/images/teacher4.png",
            videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_3840_2160_30fps.mp4",
            description: "Learn the fundamental concepts of calculus.",
            rating: 4.9,
            redirectLink: "https://www.youtube.com/@RockstarMathTutoring/videos", // ✅ Custom Link
        },
        {
            title: "Algebra I & II",
            thumbnail: "/images/teacher1.png",
            videoUrl: "/videos/video.mp4",
            description: "Build a solid foundation in algebra with lessons for beginners.",
            rating: 4.8,
            redirectLink: "https://www.youtube.com/watch?v=8pLuWu9w_4w", // ✅ Custom Link
        },
        {
            title: "Calculus Basics",
            thumbnail: "/images/teacher2.png",
            videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_3840_2160_30fps.mp4",
            description: "Learn the fundamental concepts of calculus.",
            rating: 4.9,
            redirectLink: "https://www.youtube.com/@RockstarMathTutoring/videos", // ✅ Custom Link
        },
        {
            title: "Algebra I & II",
            thumbnail: "/images/teacher3.png",
            videoUrl: "/videos/video.mp4",
            description: "Build a solid foundation in algebra with lessons for beginners.",
            rating: 4.8,
            redirectLink: "https://www.youtube.com/@RockstarMathTutoring/videos", // ✅ Custom Link
        },
        {
            title: "Calculus Basics",
            thumbnail: "/images/teacher4.png",
            videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_3840_2160_30fps.mp4",
            description: "Learn the fundamental concepts of calculus.",
            rating: 4.9,
            redirectLink: "https://www.youtube.com/@RockstarMathTutoring/videos", // ✅ Custom Link
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
        <>
       <AnimatedSection direction="bottom">
                <div className="w-full py-12 px-4 lg:px-16 bg-gray-50">
                    <div className="text-center mb-10 animate__animated animate__fadeIn">
                        <h1 className="text-4xl font-bold text-gray-900">
                            Most Popular <a className="italic text-blue-600 underline capitalize" href="https://www.youtube.com/@RockstarMathTutoring/videos">videos</a>
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Explore our top-rated <a className="italic text-blue-600 underline" href="https://www.youtube.com/@RockstarMathTutoring/videos">videos</a> to start your learning journey.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate__animated animate__fadeInUp">
                        {topics.map((topic, index) => (
                            <div
                                key={index}
                                className="w-full flex flex-col justify-between border border-gray-200 rounded-lg p-4 bg-white shadow-md transition hover:shadow-xl"
                            >
                                <div className="relative">
                                    <img
                                        src={topic.thumbnail}
                                        alt="Thumbnail"
                                        className="w-full h-40 object-cover rounded-lg mb-4"
                                    />
                                    <div
                                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg cursor-pointer transition hover:bg-opacity-70"
                                        onClick={() => openModal(topic.videoUrl)}
                                    >
                                        <IoMdPlay className="text-white text-4xl" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-gray-800">{topic.title}</h3>
                                    <div className="flex items-center">
                                        <span className="text-debg-deepBlue font-bold">{topic.rating}</span>
                                        <IoMdStar className="text-debg-deepBlue ml-1" />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">{topic.description}</p>

                                {/* ✅ Custom Redirect Link for each topic */}
                                <Link to={topic.redirectLink} className="text-center py-2 px-4 bg-deepBlue text-white rounded-lg font-semibold transition hover:bg-sky-600">
                                    Start Learning
                                </Link>
                            </div>
                        ))}
                    </div>

                    {isModalOpen && (
                        <div
                            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40"
                            onClick={closeModalOnBackdrop}
                        >
                            <div className="w-full max-w-4xl p-4">
                                <video src={currentVideo} controls className="w-full rounded-lg shadow-lg" />
                            </div>
                        </div>
                    )}

                    {isModalOpen && (
                        <button
                            onClick={closeModal}
                            className="fixed top-4 right-4 bg-deepBlue text-white p-3 rounded-full shadow-lg hover:bg-darkTeal transition"
                        >
                            <IoMdClose className="text-xl" />
                        </button>
                    )}
                </div>
            </AnimatedSection>
</>
    );
}

export default PopTopic;

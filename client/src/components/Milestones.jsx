import React from "react";
import AnimatedSection from "./AnimatedSection";

function Milestones() {
    return (
        <AnimatedSection direction="bottom">
        <div className="w-full py-14 px-6 lg:px-20 ">
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="w-full text-center lg:text-left mb-12">
                    <h1 className="text-4xl font-bold text-gray-800">
                        Amy’s / Rockstar Math Milestones
                    </h1>
                </div>

                {/* Content */}
                <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-12">
                    {/* Grid Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full lg:w-1/2">
                        <div className="milestone-item p-6  flex items-center gap-6  transition-shadow">
                            <img
                                src="/images/mortarBoardGreen.png"
                                alt="Instructors Icon"
                                className="w-16 h-auto"
                            />
                            <div>
                            <p className="text-3xl font-bold text-gray-800">100s</p>
                            <p className="text-gray-600 capitalize">of successful students</p>
                                
                            </div>
                        </div>
                        <div className="milestone-item p-6  flex items-center gap-6 transition-shadow">
                            <img
                                src="/images/video.png"
                                alt="Videos Icon"
                                className="w-16 h-auto"
                            />
                            <div>
                            <p className="text-3xl font-bold text-gray-800">10,000</p>
                            <p className="text-gray-600 capitalize">hours of tutoring</p>
                            </div>
                        </div>
                        <div className="milestone-item p-6  flex items-center gap-6 transition-shadow">
                            <img
                                src="/images/mortarBoardRed.png"
                                alt="Graduated Students Icon"
                                className="w-16 h-auto"
                            />
                            <div>
                                <p className="text-3xl font-bold text-gray-800">2 </p>
                                <p className="text-gray-600 capitalize">math degrees</p>
                            </div>
                        </div>
                        <div className="milestone-item p-6  flex items-center gap-6 transition-shadow">
                            <img
                                src="/images/students.png"
                                alt="Students Enrolled Icon"
                                className="w-16 h-auto"
                            />
                            <div>
                                <p className="text-3xl font-bold text-gray-800">1</p>
                                <p className="text-gray-600 capitalize">patent pending</p>
                            </div>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="w-full lg:w-1/2 flex justify-center">
                        <img
                            src="/images/amy.png"
                            alt="Milestone Image"
                            className="rounded-lg shadow-lg w-full max-w-[450px] object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
        </AnimatedSection>
    );
}

export default Milestones;

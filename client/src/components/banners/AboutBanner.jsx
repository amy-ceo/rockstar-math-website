import React from 'react';
import AnimatedSection from '../AnimatedSection';

function AboutBanner() {
    return (
        <div
            className="relative bg-cover bg-center bg-no-repeat py-16 sm:py-20 px-6 sm:px-8 text-lightGray font-sans mt-11"
            style={{
                backgroundImage: `url('/images/aboutBanner.png')`,
            }}
        >
            {/* Overlay for better text visibility */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            {/* Content */}
            <AnimatedSection direction='right'>
            <div className="relative max-w-4xl mx-auto text-center">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">Learning from an expert...</h3>
                <p className="text-lg sm:text-xl leading-relaxed">
                Amy has worked with students one on one for over 20 years. She found 3 things holding students back. They didn't know how to read and speak math, they were memorizing steps instead of understanding them and they didn't know how to learn math through practice. 

                </p>
            </div>
            </AnimatedSection>
        </div>
    );
}

export default AboutBanner;

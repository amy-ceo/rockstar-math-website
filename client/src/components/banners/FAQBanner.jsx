import React from 'react';

function FAQBanner() {
    return (
        <div className="relative h-96 overflow-hidden">
        {/* Background Image */}
        <img
            src="/images/faq.webp"
            alt="FAQ Banner"
            className="absolute w-full h-full object-cover"
        />
    
        {/* Darker Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black opacity-75"></div>
    
       
    </div>
    

    );
}

export default FAQBanner;

import React from 'react'

function ContactBanner() {
    return (
        <>
        {/* Banner Section */}
<div className="bg-deepBlue py-10 px-6 text-white font-sans">
    <div className="flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto">
        {/* Left Section: Text */}
        <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl font-bold mb-4 leading-relaxed">
                To contact us, please complete and submit the form below. 
                <br />
                We’ll get back with you within 24 hours. Thank you!
            </h2>
        </div>

        {/* Right Section: Logo */}
        <div className="lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative">
                <img
                    src="/images/logo1.png"
                    alt="Company Logo"
                    className="w-[280px] h-auto z-10 relative"
                />
            </div>
        </div>
    </div>
</div>

        </>
    )
}

export default ContactBanner
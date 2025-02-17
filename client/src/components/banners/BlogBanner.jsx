import React from 'react';

function BlogBanner() {
    return (
        <div className="relative h-96 overflow-hidden">
    {/* Background Image */}
    <img
        src="/images/blog.webp"
        alt="Blog Banner"
        className="absolute w-full h-full object-cover"
    />

    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black opacity-75"></div>

   
</div>

    );
}

export default BlogBanner;

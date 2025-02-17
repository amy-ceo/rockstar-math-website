import React from 'react';
import AnimatedSection from '../AnimatedSection';

function ReviewsBanner() {
    return (
<div
  className="bg-cover bg-center py-32 relative"
  style={{ backgroundImage: `url(/images/about2.png)` }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-black bg-opacity-50"></div>

  {/* Content */}
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <AnimatedSection direction='right'>
    <div className="flex flex-col items-center justify-center text-center">
      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
        RockstarMath Reviews from students just like you…
      </h2>

      {/* Subtext */}
      <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl">
        RockstarMath has consistently received positive reviews from students who
        have used its resources to enhance their understanding of calculus. Here are
        some common themes found in student feedback:
      </p>
    </div>
    </AnimatedSection>
  </div>
</div>

    
    );
}

export default ReviewsBanner;

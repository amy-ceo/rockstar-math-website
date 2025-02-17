import React, { Suspense, lazy } from "react";

// ✅ Lazy Load Components
const ReviewsBanner = lazy(() => import("../components/banners/ReviewsBanner"));
const Reviews = lazy(() => import("../components/Reviews"));

function ReviewsPage() {
  return (
    <>
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Banner...</div>}>
        <ReviewsBanner />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Reviews...</div>}>
        <Reviews />
      </Suspense>
    </>
  );
}

export default ReviewsPage;

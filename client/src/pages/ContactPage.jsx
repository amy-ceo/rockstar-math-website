import React, { Suspense, lazy } from "react";

// Lazy Load Components
const ContactBanner = lazy(() => import("../components/banners/ContactBanner"));
const ContactForm = lazy(() => import("../components/ContactForm"));

function ContactPage() {
  return (
    <div>
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Banner...</div>}>
<br />
<br />

        <ContactBanner />
      </Suspense>

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Contact Form...</div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}

export default ContactPage;

import React from "react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa6";

import SubscribeForm from "./SubscribeForm";

const Footer = () => {
  // Define your links with URLs
  const navLinks = [
    { name: "Home", url: "/" },
    { name: "Reviews", url: "/reviews" },
    { name: "Courses", url: "/courses" },
    { name: "Services", url: "/services" },
    { name: "FAQs", url: "/faqs" },
    { name: "Blogs", url: "/blogs" },
    { name: "About", url: "/about" },
    { name: "Contact", url: "/contact" },
    { name: "Log in", url: "/login" },
  ];

  const categories = [
    { name: "Trigonometry", url: "/courses" },
    { name: "Pre-Calculus", url: "/courses" },
    { name: "Math Analysis", url: "/courses" },
    { name: "Calculus 1", url: "/courses" },
    { name: "Calculus 2", url: "/courses" },
    { name: "Business Calculus", url: "/courses" },
  ];

  return (
    <footer className="bg-gray-50 py-12 px-8 lg:px-16">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 text-gray-800">
        
        {/* Column 1: Contact Us */}
        <div className="lg:col-span-2">
          <img src="/images/logo.png" alt="Company Logo" className="w-40 h-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Call:{" "}
              <a href="tel:+15104104963" className="hover:underline hover:text-sky-600 transition">
                (510) 410-4963
              </a>
            </p>
            <p>Serving the Bay Area</p>
            <p>
              Email:{" "}
              <a href="mailto:rockstarmathtutoring@gmail.com" className="hover:underline hover:text-sky-600 transition">
                rockstarmathtutoring@gmail.com
              </a>
            </p>
          </div>
          <div className="flex mt-6 gap-4">
            <a href="https://facebook.com/rockstartutoring" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-sky-600 transition text-xl">
              <FaFacebook />
            </a>
            <a href="https://www.instagram.com/rockstarmath/rockstartutoring" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-sky-600 transition text-xl">
              <FaInstagram />
            </a>
            <a href="https://x.com/rock_star_math" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-sky-600 transition text-xl">
            <FaTwitter />
            </a>
            <a href="https://www.youtube.com/watch?v=aYH6CCTiqVY" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-sky-600 transition text-xl">
            <FaYoutube />
            </a>
          </div>
        </div>

        {/* Explore Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Explore</h3>
          <ul className="space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.url} className="hover:text-sky-600 hover:underline transition">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.name}>
                <a href={category.url} className="hover:text-sky-600 hover:underline transition">
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribe Section */}
        <div className="lg:col-span-2 xl:pl-8">
          <SubscribeForm />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-10 text-center text-sm text-gray-600">
        © 2025 Rockstar Math. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

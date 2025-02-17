import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaBook,
  FaCalendarAlt,
  FaEnvelope,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const [isExpanded, setIsExpanded] = useState(true); // Toggle state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Detect mobile screens

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`bg-deepBlue text-white h-auto flex flex-col py-28 transition-all duration-300 
        ${isMobile ? "w-20 items-center" : isExpanded ? "w-80 items-start px-6" : "w-20 items-center sm:w-20"}
      `}
    >
      {/* Toggle Button (Hidden on Mobile) */}
      {!isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex ${isExpanded ? "justify-end" : "justify-center"} mb-6`}
        >
          {isExpanded ? <FaTimes className="text-2xl cursor-pointer" /> : <FaBars className="text-2xl cursor-pointer" />}
        </button>
      )}

      {/* Navigation Items */}
      <ul className="space-y-6 w-full">
        <li>
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-2 text-lg rounded-lg hover:bg-blue-600 transition-all duration-300 
            ${isExpanded && !isMobile ? "justify-start" : "justify-center"}`}
          >
            <FaHome className="text-xl" /> {!isMobile && isExpanded && "Home"}
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/courses"
            className={`flex items-center gap-3 px-4 py-2 text-lg rounded-lg hover:bg-blue-600 transition-all duration-300 
            ${isExpanded && !isMobile ? "justify-start" : "justify-center"}`}
          >
            <FaBook className="text-xl" /> {!isMobile && isExpanded && "My Classes"}
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/schedule"
            className={`flex items-center gap-3 px-4 py-2 text-lg rounded-lg hover:bg-blue-600 transition-all duration-300 
            ${isExpanded && !isMobile ? "justify-start" : "justify-center"}`}
          >
            <FaCalendarAlt className="text-xl" /> {!isMobile && isExpanded && "Schedule"}
          </Link>
        </li>
        {/* <li>
          <Link
            to="/dashboard/messages"
            className={`flex items-center gap-3 px-4 py-2 text-lg rounded-lg hover:bg-blue-600 transition-all duration-300 
            ${isExpanded && !isMobile ? "justify-start" : "justify-center"}`}
          >
            <FaEnvelope className="text-xl" /> {!isMobile && isExpanded && "Messages"}
          </Link>
        </li> */}
      </ul>

      {/* Logout Button */}
      <div className="mt-16 w-full">
        <Link
        onClick={handleLogout}
          to="/login"
          className={`flex items-center gap-3 py-2 px-4 text-lg rounded-lg text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 
          ${isExpanded && !isMobile ? "justify-start" : "justify-center"}`}
        >
          <FaSignOutAlt className="text-xl" /> {!isMobile && isExpanded && "Logout"}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

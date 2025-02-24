import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminHeader = () => {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch Admin Data from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Remove Token
    localStorage.removeItem("adminData"); // Remove Admin Info
    navigate("/admin"); // Redirect to Login Page
  };

  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      {/* ✅ Fix: Only show admin name when data is available */}
      <h1 className="text-xl font-bold">
        Welcome, {admin ? admin.name : "Loading..."}
      </h1>

      {admin ? (
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded text-white"
        >
          Logout
        </button>
      ) : (
        <span className="text-gray-300">Loading...</span>
      )}
    </div>
  );
};

export default AdminHeader;

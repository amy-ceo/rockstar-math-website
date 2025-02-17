import React, { useEffect, useState } from "react";
import { FaBell, FaChevronDown } from "react-icons/fa";

const Header = () => {
  const [user, setUser] = useState({ username: "Guest" });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.username) {
      setUser(storedUser);
    }
  }, []);

  return (
    <div className="bg-white shadow-sm px-10 py-4 flex items-center justify-between w-full mt-16">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Welcome {user.username}</h1>
        <p className="text-gray-500 text-sm">Welcome nice to see you!!</p>
      </div>

      {/* <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer">
          <FaBell className="text-gray-600 text-lg" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full"></span>
        </div>

        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="hidden md:block">
            <p className="text-gray-800 font-medium">{user.username}</p>
          </div>
          <FaChevronDown className="text-gray-600 text-sm" />
        </div>
      </div> */}
    </div>
  );
};

export default Header;

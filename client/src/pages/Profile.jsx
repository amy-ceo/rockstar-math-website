import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; // ✅ React-Hot-Toast

const Profile = () => {
  const [userData, setUserData] = useState({
    username: "",
    billingEmail: "",
    phone: "",
    goals: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ Fetch user ID from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id || "";

  // ✅ Load user details from localStorage or API
  useEffect(() => {
    if (storedUser) {
      setUserData(storedUser);
    } else {
      fetchUserDetails();
    }
  }, []);

  const fetchUserDetails = async () => {
    try {
      const res = await axios.get(`https://backend-production-cbe2.up.railway.app/api/user/${userId}`);
      const userInfo = res.data || { username: "", billingEmail: "", phone: "", goals: "" };
      setUserData(userInfo);
      localStorage.setItem("user", JSON.stringify(userInfo)); // ✅ Update localStorage
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // ✅ Handle Form Submission (Profile & Password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Update Profile
      await axios.put(`https://backend-production-cbe2.up.railway.app/api/user/update/${userId}`, userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Profile updated successfully!");

      // ✅ Update Password if fields are filled
      if (passwords.oldPassword && passwords.newPassword) {
        const res = await axios.put(`https://backend-production-cbe2.up.railway.app/api/user/update-password/${userId}`, passwords);
        toast.success(res.data.message);
        setPasswords({ oldPassword: "", newPassword: "" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Toaster position="top-center" reverseOrder={false} /> {/* ✅ React-Hot-Toast */}

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ Profile Section */}
          <div className="">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Personal Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600">Username:</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600">Email:</label>
                <input
                  type="email"
                  name="billingEmail"
                  value={userData.billingEmail || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600">Phone:</label>
                <input
                  type="text"
                  name="phone"
                  value={userData.phone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600">Goals:</label>
                <input
                  type="text"
                  name="goals"
                  value={userData.goals || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* ✅ Password Section */}
          <div className="">
    

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600">Old Password:</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwords.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter old password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-gray-600">New Password:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          </div>

          {/* ✅ Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

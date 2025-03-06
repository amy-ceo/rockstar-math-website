import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; 

const Profile = () => {
  const [userData, setUserData] = useState({
    username: "",
    billingEmail: "",
    schedulingEmails: "", // ✅ Fixed
    phone: "",
    goals: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ Correctly fetch `userId` from `localStorage`
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id || "";

  console.log("📌 Stored User in Local Storage:", storedUser);
  console.log("🔹 Extracted userId:", userId);

  // ✅ Fetch user details
  useEffect(() => {
    if (storedUser && storedUser.schedulingEmails && storedUser.goals) {
      console.log("📌 Loaded User from Local Storage:", storedUser);
      setUserData(storedUser);
    } else {
      fetchUserDetails();
    }
  }, []);

  const fetchUserDetails = async () => {
    try {
      console.log("📡 Fetching user details for userId:", userId);

      // Ensure `userId` is valid before making the request
      if (!userId) {
        console.error("❌ No valid userId found! Cannot fetch user details.");
        return;
      }

      const res = await axios.get(`https://backend-production-cbe2.up.railway.app/api/user/${userId}`);

      console.log("✅ API Response:", res.data);

      if (res.data.success && res.data.user) {
        setUserData(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user)); // ✅ Ensure local storage is updated
      } else {
        console.error("❌ User data missing from API response!");
      }
    } catch (error) {
      console.error("❌ Error fetching user details:", error.response || error);
    }
  };

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // ✅ Handle Profile Update Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📡 Sending Profile Update Request with Data:", userData);

      const res = await axios.put(`https://backend-production-cbe2.up.railway.app/api/user/update/${userId}`, userData);

      console.log("✅ Update Response:", res.data);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Profile updated successfully!");

    } catch (error) {
      console.error("❌ Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update.");
    }

    setLoading(false);
  };

  // ✅ Handle Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📡 Sending Password Update Request with Data:", passwords);

      const res = await axios.put(
        `https://backend-production-cbe2.up.railway.app/api/user/update-password/${userId}`,
        passwords
      );

      console.log("✅ Password Update Response:", res.data);
      toast.success("Password updated successfully!");
      setPasswords({ oldPassword: "", newPassword: "" });

    } catch (error) {
      console.error("❌ Error updating password:", error);
      toast.error(error.response?.data?.message || "Failed to update password.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
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
                <label className="block text-gray-600">Billing Email:</label>
                <input
                  type="email"
                  name="billingEmail"
                  value={userData.billingEmail || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600">Scheduling Email:</label>
                <input
                  type="email"
                  name="schedulingEmails"
                  value={userData.schedulingEmails || ""}
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
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Change Password</h3>

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

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300">
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

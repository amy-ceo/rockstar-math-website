const Register = require("../models/registerModel");
const bcrypt = require("bcryptjs");
// ✅ Update User Profile
exports.updateUserProfile = async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, billingEmail, phone, goals } = req.body;
  
      // ✅ Find User and Update
      const updatedUser = await Register.findByIdAndUpdate(
        userId,
        { username, billingEmail, phone, goals },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found!" });
      }
  
      res.status(200).json({ success: true, message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  // ✅ Update Password
exports.updateUserPassword = async (req, res) => {
    try {
      const { userId } = req.params;
      const { oldPassword, newPassword } = req.body;
  
      const user = await Register.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
  
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };
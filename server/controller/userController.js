const Register = require("../models/registerModel");
const bcrypt = require("bcryptjs");

// ✅ Fetch User Profile (Fix for Missing API)
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("📡 Fetching user profile for userId:", userId);

        const user = await Register.findById(userId);
        if (!user) {
            console.error("❌ User not found in database!");
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        console.log("✅ Fetched User Data:", user);
        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


// ✅ Debugging User Profile Update API
exports.updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, billingEmail, schedulingEmails, phone, goals } = req.body;

        console.log("🔹 Received Update Request for User ID:", userId);
        console.log("📝 Request Body Data:", req.body);

        // ✅ Fetch user before update to compare old vs new values
        const existingUser = await Register.findById(userId);
        if (!existingUser) {
            console.error("❌ User not found in database!");
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        console.log("📌 Existing User Data Before Update:", existingUser);

        // ✅ Ensure all fields are updated
        const updatedUser = await Register.findByIdAndUpdate(
            userId,
            { 
                username, 
                billingEmail, 
                schedulingEmails, 
                phone, 
                goals 
            },
            { new: true, runValidators: true } // ✅ Ensures updated data is returned
        );

        if (!updatedUser) {
            console.error("❌ Failed to update user profile!");
            return res.status(500).json({ success: false, message: "Failed to update profile" });
        }

        console.log("✅ Updated User Data:", updatedUser);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.error("❌ Error updating user profile:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ✅ Debugging Password Update API
exports.updateUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { oldPassword, newPassword } = req.body;

        console.log("🔹 Received Password Change Request for User ID:", userId);
        console.log("📝 Request Body Data:", req.body);

        const user = await Register.findById(userId);
        if (!user) {
            console.error("❌ User not found in database!");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("📌 Verifying Old Password...");
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            console.error("❌ Old password does not match!");
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        console.log("🔄 Hashing New Password...");
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        console.log("✅ Password Updated Successfully!");
        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("❌ Server error while updating password:", error);
        res.status(500).json({ message: "Server error" });
    }
};

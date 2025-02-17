const Register = require("../models/registerModel"); // ✅ Ensure this line exists

const checkUserRegistration = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, error: "Email and Phone are required for checking registration!" });
    }

    console.log("🔍 Checking registration for:", { email, phone });

    // ✅ Check if user exists in database
    const existingUser = await Register.findOne({ $or: [{ billingEmail: email }, { phone: phone }] });

    if (existingUser) {
      console.log("✅ User exists in database:", existingUser);
      return res.status(200).json({ success: true, message: "User already registered!" });
    }

    console.log("❌ User not found in database.");
    res.status(200).json({ success: false, message: "User not found, proceed with registration." });

  } catch (error) {
    console.error("❌ Backend Error in check-registration:", error);
    res.status(500).json({ success: false, error: "Something went wrong!", details: error.message });
  }
};

module.exports = { checkUserRegistration };

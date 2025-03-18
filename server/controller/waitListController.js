const sendEmail = require("../utils/emailSender");
const Waitlist = require("../models/Waitlist");

exports.requestWaitlist = async (req, res) => {
  const { email, firstname, lastname, phonenumber, currentgrade, selectedCourse } = req.body;

  console.log("🟡 Received Waitlist Data:", req.body); // Log received data

  if (!email || !firstname || !lastname || !phonenumber || !currentgrade || !selectedCourse) {
    console.error("❌ Missing Fields in Request");
    return res.status(400).json({ error: "All required fields must be filled!" });
  }

  try {
    // ✅ Save to Database with Debugging
    console.log("📌 Attempting to save data to MongoDB...");

    const newWaitlistEntry = new Waitlist({
      firstname,
      lastname,
      email,
      phonenumber,
      currentgrade,
      selectedCourse,
    });

    const savedEntry = await newWaitlistEntry.save();
    console.log("✅ Successfully Saved to Database:", savedEntry); // Debugging log

    // ✅ Check if the data actually saved
    const checkEntry = await Waitlist.findOne({ email });
    if (!checkEntry) {
      console.error("❌ Data not found after save operation!");
      return res.status(500).json({ success: false, message: "Data save failed in MongoDB" });
    }

    // ✅ Send Email
    const adminEmail = "rockstarmathtutoring@gmail.com";
    const subject = "📢 New Waitlist Request";

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
        <h2 style="text-align: center; color: #1e293b; font-size: 22px; font-weight: bold; margin-bottom: 20px;">
          📢 New Waitlist Request
        </h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Dear Admin,</p>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 10px;">
          You have received a new Waitlist request. Below are the details:
        </p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #d1d5db;">
          <p><strong>📧 First Name:</strong> ${firstname}</p>
          <p><strong>📧 Last Name:</strong> ${lastname}</p>
          <p><strong>📧 Email:</strong> ${email}</p>
          <p><strong>📧 Phone Number:</strong> ${phonenumber}</p>
          <p><strong>📧 Current Grade:</strong> ${currentgrade}</p>
          <p><strong>📚 Selected Course:</strong> ${selectedCourse}</p> <!-- ✅ Ensure it's displayed in the email -->
        </div>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 10px;">
          Please reach out to the user at your earliest convenience.
        </p>
        <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">Best regards,</p>
        <p style="font-size: 16px; color: #111827; font-weight: bold; margin-top: 5px;">
          RockstarMath Team
        </p>
      </div>
    `;

    await sendEmail(adminEmail, subject, "", message);
    console.log("✅ Email Sent Successfully");

    res.status(200).json({
      success: true,
      message: "Waitlist request saved successfully!",
      savedEntry, // ✅ Return saved entry
    });
  } catch (error) {
    console.error("❌ Error Processing Request:", error);
    res.status(500).json({ success: false, message: "Database save failed" });
  }
};

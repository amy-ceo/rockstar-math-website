require("dotenv").config();
const sendEmail = require("./utils/emailSender");

const testEmail = async () => {
    await sendEmail(
        "bhussnain966@gmail.com",
        "📧 Test Email from Server",
        "This is a test email. Nodemailer is working!",
        "<h2>This is a test email. Nodemailer is working! ✅</h2>"
    );
};

testEmail();

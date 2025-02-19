const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html) => {
    try {
        console.log(`📧 Attempting to send email to: ${to}`);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            logger: true, // ✅ Enable logging
            debug: true,  // ✅ Show detailed logs
        });

        const mailOptions = {
            from: `"Your Academy" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        console.log("📨 Sending email...");
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully! Response: ${info.response}`);

        return true; // Ensure the function completes
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

module.exports = sendEmail;

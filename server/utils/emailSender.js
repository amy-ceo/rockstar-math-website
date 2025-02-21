const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "Gmail", // 🔹 Ensure this is correct
            auth: {
                user: process.env.EMAIL_USER,  // 🔹 Check if email credentials are set
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: html,
        };

        let info = await transporter.sendMail(mailOptions);
        console.log("✅ Email Sent: ", info.response);
        return true;
    } catch (error) {
        console.error("❌ Email Sending Failed: ", error);
        return false;
    }
};

module.exports = sendEmail;

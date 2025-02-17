const Subscriber = require("../models/subscriberModel");
const nodemailer = require("nodemailer");

exports.subscribe = async (req, res) => {
    const { email } = req.body;

    // Validation: Check if email is provided and properly formatted
    if (!email || !email.includes("@")) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    try {
        // Check if the email already exists
       // Check if email already exists in the database
       const existingSubscriber = await Subscriber.findOne({ email });
       if (existingSubscriber) {
           return res.status(400).json({ success: false, message: "Email already subscribed" });
       }

       // Save the new subscriber
       const subscriber = new Subscriber({ email });
       await subscriber.save();

        // Send a welcome email using Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail", // You can use other services like Outlook, Yahoo, etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password
            },
        });

        const mailOptions = {
            from: "bhussnain966@gmail.com",
            to: email,
            subject: "Welcome to Our Learning Community!",
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #00008B; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #00008B; padding: 20px; text-align: center; color: #fff;">
                    <h1 style="margin: 0; font-size: 24px;">Welcome to Our Learning Community!</h1>
                </div>
                <div style="padding: 20px;">
                    <p style="font-size: 16px; color: #555;">Hi there,</p>
                    <p style="font-size: 16px; color: #555;">
                        Thank you for subscribing to our learning community! We're thrilled to have you on board.
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        As a valued member, you'll get access to exclusive courses, webinars, personalized learning recommendations, and much more!
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://yourwebsite.com" style="display: inline-block; background-color: #00008B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Visit Our Platform</a>
                    </div>
                    <p style="font-size: 16px; color: #555;">
                        Stay tuned for more updates. If you have any questions, feel free to reach out to us.
                    </p>
                    <p style="font-size: 16px; color: #555;">Best regards,</p>
                    <p style="font-size: 16px; color: #555;">The Learning Community Team</p>
                </div>
                <div style="background-color: #f1f1f1; padding: 10px 20px; text-align: center; font-size: 14px; color: #777;">
                    <p style="margin: 0;">You're receiving this email because you subscribed to our platform.</p>
                    <p style="margin: 0;">If this wasn't you, please ignore this email.</p>
                </div>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Subscription successful! Email sent." });
    } catch (error) {
        console.error("Error in subscription:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

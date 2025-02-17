const nodemailer = require('nodemailer');

// Submit Form Handler
exports.submitForm = async (req, res) => {
    const { fullName, email, phoneNumber, message } = req.body;

    // Validation (Example)
    if (!fullName || !email || !message) {
        return res.status(400).json({ message: 'All fields are required!'});
    }

    try {
        // Save data to the database (if required)
        // Example with Mongoose
        // await FormModel.create({ fullName, email, phoneNumber, message });

        // Send Email Notification (Optional)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: '"Rockstar Math Team" bhussnain966@gmail.com', // Sender's email and name
            to: email, // Recipient's email
            subject: 'Thank You for Contacting Rockstar Math!',
            text: `Dear ${fullName},
        
        Thank you for reaching out to us at Rockstar Math! We’ve received your message and will get back to you within 24 hours. 
        
        If you have any urgent queries, feel free to reply to this email.
        
        Best regards,  
        The Rockstar Math Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #00008B;">
                    <h2 style="color: #FFBF00;">Thank You for Contacting Rockstar Math!</h2>
                    <p>Dear <strong>${fullName}</strong>,</p>
                    <p>We’ve received your message and will get back to you within 24 hours.</p>
                    <p>If you have any urgent queries, feel free to reply to this email.</p>
                    <p style="margin-top: 20px;">Best regards,</p>
                    <p><strong>The Rockstar Math Team</strong></p>
                </div>
            `,
        };
        

        await transporter.sendMail(mailOptions);

        // Respond to the frontend
        res.status(200).json({ message: 'Form submitted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};

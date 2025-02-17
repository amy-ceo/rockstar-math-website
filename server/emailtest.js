const nodemailer = require('nodemailer');

const sendTestEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'consultant2049@gmail.com', // Replace with your email
        pass: 'Consultant#2024', // Replace with your password or app-specific password
      },
    });

    const info = await transporter.sendMail({
      from: '"Rockstar Math" consultant2049@gmail.com',
      to: 'recipient_email@example.com', // Replace with a test email
      subject: 'Test Email',
      text: 'This is a test email!',
      html: '<p>This is a test email!</p>',
    });

    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

sendTestEmail();

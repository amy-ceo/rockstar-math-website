const sendEmail = require('../utils/emailSender')
const Consultation = require('../models/Consultation') // Import the model

exports.requestConsultation = async (req, res) => {
  const { email, firstname, lastname, phonenumber, currentgrade } = req.body

  if (!email || !firstname || !lastname || !phonenumber || !currentgrade) {
    return res.status(400).json({ error: 'All required fields must be filled!' })
  }

  try {
    // ✅ Save Email to Database
    const newConsultation = new Consultation({
      firstname,
      lastname,
      email,
      phonenumber,
      currentgrade,
    })
    await newConsultation.save()

    // ✅ Define Admin Email & Subject
    const adminEmail = 'bhussnain966@gmail.com'
    const subject = '📢 New Free Consultation Request'

    // ✅ Fully Inline CSS for Email Clients
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
        <h2 style="text-align: center; color: #1e293b; font-size: 22px; font-weight: bold; margin-bottom: 20px;">
          📢 New Free Consultation Request
        </h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Dear Admin,</p>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 10px;">
          You have received a new consultation request. Below are the details:
        </p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #d1d5db;">
          <p style="font-size: 16px; color: #111827; margin: 0;">
            <strong>📧 User First Name:</strong> 
            <a href="mailto:${firstname}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
              ${firstname}
            </a>
          </p>
           <p style="font-size: 16px; color: #111827; margin: 0;">
            <strong>📧 User Last Name:</strong> 
            <a href="mailto:${lastname}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
              ${lastname}
            </a>
          </p>
            <p style="font-size: 16px; color: #111827; margin: 0;">
            <strong>📧 User Email:</strong> 
            <a href="mailto:${email}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
              ${email}
            </a>
          </p>
            <p style="font-size: 16px; color: #111827; margin: 0;">
            <strong>📧 User Phone Number:</strong> 
            <a href="mailto:${phonenumber}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
              ${phonenumber}
            </a>
          </p>
              <p style="font-size: 16px; color: #111827; margin: 0;">
            <strong>📧 User Current Grade:</strong> 
            <a href="mailto:${currentgrade}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
              ${currentgrade}
            </a>
          </p>
        </div>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 10px;">
          Please reach out to the user at your earliest convenience.
        </p>
        <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">Best regards,</p>
        <p style="font-size: 16px; color: #111827; font-weight: bold; margin-top: 5px;">
          Rockstar Math Team
        </p>
      </div>
    `

    // ✅ Send Email
    await sendEmail(adminEmail, subject, '', message)

    res.status(200).json({
      success: true,
      message: 'Consultation request sent successfully & saved to database!',
    })
  } catch (error) {
    console.error('Error processing consultation request:', error)
    res.status(500).json({ success: false, message: 'Error processing request' })
  }
}

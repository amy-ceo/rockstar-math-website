const bcrypt = require('bcryptjs')
const Register = require('../models/registerModel')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
// ✅ Function to Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // Token valid for 7 days
}

exports.registerUser = async (req, res) => {
  try {
    let { username, password, numStudents, students, ...restData } = req.body

    console.log('🔍 Incoming Registration Data:', req.body)

    // ✅ Check if username is already taken
    const existingUser = await Register.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // ✅ Hash password before saving to DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // ✅ Validate Students Data
    if (numStudents > 1) {
      if (!Array.isArray(students) || students.length !== numStudents) {
        return res.status(400).json({ success: false, error: 'Invalid student details!' })
      }

      for (let i = 0; i < students.length; i++) {
        if (
          !students[i].name ||
          !students[i].grade ||
          !students[i].mathLevel ||
          students[i].age === ''
        ) {
          return res
            .status(400)
            .json({ success: false, error: `Student ${i + 1} details are incomplete!` })
        }
      }
    } else {
      if (!restData.studentNames || !restData.studentGrades || !restData.studentMathLevels) {
        return res.status(400).json({ success: false, error: 'Student details are required!' })
      }
    }

    // ✅ Hash the Password Before Storing
    function hashPassword(password) {
      return crypto.createHash('sha256').update(password).digest('hex')
    }

  
    console.log('🔹 Hashed Password:', hashedPassword)
    const newUser = new Register({
      username: req.body.username.toLowerCase(),
      password: hashedPassword, // ✅ Store hashed password only once
      numStudents,
      students:
        numStudents > 1
          ? students
          : [
              {
                name: restData.studentNames,
                grade: restData.studentGrades,
                mathLevel: restData.studentMathLevels,
                age: restData.studentAge,
              },
            ],
      ...restData,
    })

    await newUser.save()

    // ✅ Generate JWT Token
    const token = generateToken(newUser._id)

    console.log('✅ Registration Successful:', newUser)

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        _id: newUser._id,
        username: newUser.username,
        billingEmail: newUser.billingEmail,
        phone: newUser.phone,
      },
      token, // ✅ Send token to frontend
    })
  } catch (error) {
    console.error('❌ Registration Error:', error)
    res.status(500).json({ success: false, error: 'Registration failed. Please try again!' })
  }
}

exports.addPurchasedClass = async (req, res) => {
  try {
      const { userId, purchasedClasses } = req.body;

      if (!userId || !purchasedClasses || purchasedClasses.length === 0) {
          return res.status(400).json({ message: "Invalid request. Missing data." });
      }

      const user = await Register.findById(userId);
      if (!user) {
          return res.status(404).json({ message: "User not found." });
      }

      // ✅ Add classes to the purchasedClasses array
      user.purchasedClasses.push(...purchasedClasses);
      await user.save();

      return res.status(200).json({ message: "Purchased classes updated.", purchasedClasses: user.purchasedClasses });
  } catch (error) {
      console.error("❌ Error adding purchased class:", error);
      res.status(500).json({ message: "Server error" });
  }
};
exports.getPurchasedClasses = async (req, res) => {
  try {
    const { userId } = req.params // Get `userId` from the URL

    console.log('🔍 Fetching Purchased Classes for User ID:', userId) // Debugging log

    // ✅ Check if User Exists
    const user = await Register.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Return Purchased Classes
    res.status(200).json({
      message: 'Purchased classes retrieved successfully!',
      purchasedClasses: user.purchasedClasses || [],
    })
  } catch (error) {
    console.error('❌ Error Fetching Purchased Classes:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

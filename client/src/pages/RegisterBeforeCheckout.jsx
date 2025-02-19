import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import { useAuth } from "../context/AuthContext";

const RegisterBeforeCheckout = () => {
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'Parent',
    adultName: '',
    numStudents: 1, // Default: 1 student
    students: [{ name: '', grade: '', mathLevel: '', age: '' }], // Store students dynamically
    billingEmail: '',
    schedulingEmails: '',
    phone: '',
    goals: '',
    didUserApproveSMS: false,
    didUserApproveWebcam: false,
  })

  const [otp, setOtp] = useState('') // OTP input field
  const [isOtpPopupOpen, setIsOtpPopupOpen] = useState(false) // OTP popup state
  const [isOtpVerified, setIsOtpVerified] = useState(false) // OTP verification state
  const [generatedOtp, setGeneratedOtp] = useState('') // Store received OTP for comparison
  const [isWebcamPopupOpen, setIsWebcamPopupOpen] = useState(false)
  const [isSmsPopupOpen, setIsSmsPopupOpen] = useState(false)
  const { users } = useAuth();
  const navigate = useNavigate()

  useEffect(() => {
    // ✅ If user is logged in, redirect to checkout
    if (users) {
      navigate("/checkout");
    }
  }, [users, navigate]);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // ✅ Prevent negative values in "Number of Students"
  // ✅ Handle Number of Students Change
  // ✅ Handle Number of Students Change
  const handleNumStudentsChange = (e) => {
    let value = parseInt(e.target.value, 10)
    if (isNaN(value) || value < 1) value = 1 // Minimum: 1 student
    if (value > 10) value = 10 // Maximum: 10 students

    setFormData((prev) => {
      let updatedStudents = [...prev.students]

      if (value > updatedStudents.length) {
        for (let i = updatedStudents.length; i < value; i++) {
          updatedStudents.push({ name: '', grade: '', mathLevel: '', age: '' })
        }
      } else {
        updatedStudents.length = value
      }

      return { ...prev, numStudents: value, students: updatedStudents }
    })
  }

  // ✅ Handle Dynamic Student Fields
  const handleStudentChange = (index, e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      let updatedStudents = [...prev.students]
      updatedStudents[index][name] = value
      return { ...prev, students: updatedStudents }
    })
  }
  useEffect(() => {
    if (formData.numStudents === 1) {
      setFormData((prev) => ({
        ...prev,
        students: [{ name: '', grade: '', mathLevel: '', age: '' }],
      }))
    }
  }, [formData.numStudents])

  // ✅ Open OTP Popup (Checkbox or Text Click)
  // ✅ Open OTP Popup and Send OTP
  const openOtpPopup = async () => {
    if (!formData.phone || formData.phone === '') {
      toast.error('Please enter a valid phone number!')
      return
    }

    setIsOtpPopupOpen(true)

    try {
      const response = await axios.post('https://frontend-production-9912.up.railway.app/api/send-otp', {
        phone: formData.phone,
      })

      if (response.data.success) {
        toast.success('OTP sent successfully!')
        setGeneratedOtp(response.data.otp) // ⚠️ Store OTP securely (Remove this in production!)
      } else {
        toast.error('Failed to send OTP. Try again!')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error sending OTP.')
    }
  }

  // ✅ Handle Webcam Agreement
  const openWebcamPopup = (e) => {
    e.preventDefault()
    setIsWebcamPopupOpen(true)
  }

  const handleAgreeWebcam = () => {
    setFormData((prev) => ({ ...prev, didUserApproveWebcam: true }))
    setIsWebcamPopupOpen(false)
  }

  // ✅ Verify OTP Dynamically
  const verifyOtp = async () => {
    try {
      const response = await axios.post('https://frontend-production-9912.up.railway.app/api/verify-otp', {
        phone: formData.phone,
        otp,
      })

      if (response.data.success) {
        toast.success('OTP Verified Successfully!')
        setIsOtpVerified(true)
        setIsOtpPopupOpen(false)
      } else {
        toast.error('Invalid OTP. Try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'OTP Verification Failed.')
    }
  }
  // ✅ Handle SMS Checkbox & Open OTP Popup
  const handleSmsCheckboxChange = async (e) => {
    const isChecked = e.target.checked
    setFormData((prev) => ({ ...prev, didUserApproveSMS: isChecked }))

    if (isChecked) {
      setIsOtpPopupOpen(true)
      try {
        const response = await axios.post('https://frontend-production-9912.up.railway.app/api/send-otp', {
          phone: formData.phone,
        })

        if (response.data.success) {
          toast.success('OTP sent successfully!')
        } else {
          toast.error('Failed to send OTP. Try again!')
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error sending OTP.')
      }
    }
  }

  // ✅ Page load hone pe check karein ke user pehle register ho chuka hai ya nahi
  useEffect(() => {
    const checkUserRegistration = async () => {
      try {
        const email = localStorage.getItem('userEmail')
        const phone = localStorage.getItem('userPhone')

        if (!email || !phone) return // User ka data nahi hai, allow registration

        const response = await axios.post('https://frontend-production-9912.up.railway.app/api/check-registration', {
          email,
          phone,
        })

        if (response.data.success) {
          toast.success('You are already registered! Redirecting to checkout...')
          setTimeout(() => navigate('/checkout'), 2000)
        }
      } catch (error) {
        console.error('❌ Error checking registration:', error)
      }
    }

    checkUserRegistration()
  }, [navigate])

  const openSmsPopup = (e) => {
    e.preventDefault()
    setIsSmsPopupOpen(true)
  }

  const handleAgreeSms = () => {
    setFormData((prev) => ({ ...prev, didUserApproveSMS: true }))
    setIsSmsPopupOpen(false)
    openOtpPopup() // ✅ Send OTP after agreeing
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    console.log("📝 Form Data Before Submission:", formData);
  
    const requiredFields = [
      "username",
      "password",
      "userType",
      "adultName",
      "numStudents",
      "billingEmail",
      "schedulingEmails",
      "phone",
      "goals",
    ];
  
    if (formData.userType === "Student") {
      requiredFields.push("studentAge");
    }
  
    // ✅ If only 1 student, validate these fields
    if (formData.numStudents === 1) {
      requiredFields.push("studentNames", "studentGrades", "studentMathLevels");
    } else {
      // ✅ If numStudents > 1, remove these fields before sending to backend
      delete formData.studentNames;
      delete formData.studentGrades;
      delete formData.studentMathLevels;
    }
  
    // 🔹 Validate Required Fields
    for (const field of requiredFields) {
      if (typeof formData[field] === "string" && !formData[field].trim()) {
        toast.error(`${field.replace(/([A-Z])/g, " $1")} is required!`);
        return;
      }
      if (formData[field] === undefined || formData[field] === "") {
        toast.error(`${field.replace(/([A-Z])/g, " $1")} is required!`);
        return;
      }
    }
  
    // ✅ Validate Students Array When `numStudents > 1`
    if (formData.numStudents > 1) {
      if (!Array.isArray(formData.students) || formData.students.length !== formData.numStudents) {
        toast.error("Number of students does not match the student details provided!");
        return;
      }
  
      for (let i = 0; i < formData.students.length; i++) {
        let student = formData.students[i];
  
        if (!student.name || !student.grade || !student.mathLevel || student.age === "") {
          toast.error(`Student ${i + 1} details are incomplete!`);
          return;
        }
  
        student.name = student.name.trim();
        student.grade = student.grade.trim();
        student.mathLevel = student.mathLevel.trim();
      }
    }
  
    try {
      const response = await axios.post("https://frontend-production-9912.up.railway.app/api/register", formData);
  
      if (response.data.success) {
        toast.success("Registration successful! Redirecting to checkout...");
  
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("savedUsername", formData.username);
        localStorage.setItem("savedPassword", formData.password);
        setShowConfirmation(true);
  
        setTimeout(() => {
          window.location.href = "/checkout";
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Backend Error Response:", error.response?.data);
  
      if (error.response?.data?.error === "Username already taken!") {
        toast.error("This username is already taken! Please choose another.");
      } else {
        toast.error(error.response?.data?.error || "Registration failed.");
      }
    }
  };
  

  if (showConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center animate-fade-in">
          <div className="text-6xl text-green-500 mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-800">Registration Successful!</h2>
          <p className="text-lg text-gray-700 mt-3">
            Thank you for signing up! Please check your email 📩 for further instructions.
          </p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to checkout...</p>

          <div className="flex justify-center mt-4">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-32">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Register Before Checkout
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          {/* ✅ User Type Selection */}
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium">
              Are you a Student or Parent? *
            </label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Parent">Parent (Preferred)</option>
              <option value="Student">Student</option>
            </select>
          </div>
          {/* ✅ Username & Password Fields */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-gray-700 font-medium">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4 w-full relative">
            <label className="block text-gray-700 font-medium">Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div
              className="absolute right-4 top-[55%] text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
            </div>
          </div>
          {/* ✅ Student Age Field (Only Show If "Student" is Selected) */}
          {/* {formData.userType === 'Student' && (
            <div className="col-span-2">
              <label className="block text-gray-700 font-medium">Student Age *</label>
              <input
                type="number"
                name="studentAge"
                value={formData.studentAge}
                onChange={name === 'studentAge' ? handleNumStudentsChange : handleChange}
                required
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )} */}
          {/* ✅ Always Show These Inputs */}
          {[
            { name: 'adultName', label: 'Name of Adult *' },
            { name: 'numStudents', label: 'Number of Students *', type: 'number' },
          ].map(({ name, label, type = 'text' }) => (
            <div key={name} className="col-span-2 md:col-span-1">
              <label className="block text-gray-700 font-medium">{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={name === 'numStudents' ? handleNumStudentsChange : handleChange}
                min={name === 'numStudents' ? '0' : undefined}
                required
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {/* ✅ Student Age Field (Show only when numStudents === 1) */}
          {formData.numStudents === 1 && (
            <div className="col-span-2">
              <label className="block text-gray-700 font-medium">Student Age *</label>
              <input
                type="number"
                name="studentAge"
                value={formData.studentAge}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  setFormData((prev) => ({
                    ...prev,
                    studentAge: isNaN(value) ? '' : Math.max(0, value), // ✅ Prevent negative value
                  }))
                }}
                required
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {/* ✅ These Fields Will Only Show If numStudents === 1 */}
          {formData.numStudents === 1 && (
            <>
              {[
                { name: 'studentNames', label: 'Name of Student(s) *' },
                { name: 'studentGrades', label: 'Grade of Student(s) *' },
                { name: 'studentMathLevels', label: 'Level of Math for Student(s) *' },
              ].map(({ name, label }) => (
                <div key={name} className="col-span-2 md:col-span-1">
                  <label className="block text-gray-700 font-medium">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </>
          )}
          {[
            { name: 'billingEmail', label: 'Email for Billing *', type: 'email' },
            { name: 'schedulingEmails', label: 'Email(s) for Scheduling *', type: 'email' },
            { name: 'phone', label: 'Phone Number *' },
            { name: 'goals', label: 'Your Goals & Expectations *' },
          ].map(({ name, label, type = 'text' }) => (
            <div key={name} className="col-span-2 md:col-span-1">
              <label className="block text-gray-700 font-medium">{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {/* ✅ Show Student Fields Only If `numStudents > 1` */}
          {formData.numStudents > 1 &&
            formData.students.map((student, index) => (
              <div key={index} className="col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder={`Student ${index + 1} Name`}
                  value={student.name}
                  onChange={(e) => handleStudentChange(index, e)}
                  required
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="grade"
                  placeholder="Grade"
                  value={student.grade}
                  onChange={(e) => handleStudentChange(index, e)}
                  required
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="mathLevel"
                  placeholder="Math Level"
                  value={student.mathLevel}
                  onChange={(e) => handleStudentChange(index, e)}
                  required
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={student.age}
                  onChange={(e) => handleStudentChange(index, e)}
                  required
                  className="p-3 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          {/* ✅ Conditionally Show Parent Fields Only If Student Age < 18 */}
          {/* {formData.userType === 'Student' &&
            formData.studentAge &&
            parseInt(formData.studentAge) < 18 && (
              <>
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium">Parent's Email *</label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium">Parent's Phone *</label>
                  <input
                    type="text"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    required
                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )} */}
          {/* ✅ Checkboxes */}
          <div className="col-span-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                name="didUserApproveSMS"
                checked={formData.didUserApproveSMS}
                onChange={handleSmsCheckboxChange}
              />
              <Link
                to="#"
                onClick={openSmsPopup}
                className="text-gray-700 text-sm underline  text-blue-700"
              >
                I agree to receive SMS notifications
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                name="didUserApproveWebcam"
                checked={formData.didUserApproveWebcam}
                onChange={handleChange}
              />
              <Link
                to="#"
                onClick={openWebcamPopup}
                className="text-gray-700 text-sm underline  text-blue-700"
              >
                I agree to use a webcam
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="col-span-2 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg"
          >
            Continue to Checkout
          </button>
        </form>
      </div>

      {/* ✅ Webcam Agreement Popup */}
      {isWebcamPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 pt-14">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-96 text-center">
            <h3 className="text-2xl font-bold text-gray-800">Webcam Attendance Agreement</h3>
            <p className="text-sm text-gray-600 mt-4 text-left">
              Rockstar Math Webcam Attendance & Identity Verification Policy
            </p>
            <ul className="text-left text-gray-600 text-sm mt-2">
              <li>
                ✅ Attendance Verification – Ensuring students are present for their scheduled
                sessions.
              </li>
              <li>
                ✅ Identity Confirmation – Preventing unauthorized individuals from joining
                sessions.
              </li>
              <li>✅ Engagement & Participation – Encouraging active participation in lessons.</li>
            </ul>
            <p className="text-left text-gray-600 text-sm mt-2">
              <strong>Agreement Terms:</strong>
              <br />
              ● Students must have their webcam turned on during all live sessions.
              <br />
              ● Failure to comply may result in removal from the session.
              <br />● Exceptions may be granted for documented technical difficulties or special
              accommodations.
            </p>
            <button
              onClick={handleAgreeWebcam}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-md"
            >
              I AGREE
            </button>
          </div>
        </div>
      )}

      {/* ✅ SMS Agreement Popup */}
      {isSmsPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 pt-14">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-96 text-center">
            <h3 className="text-2xl font-bold text-gray-800">SMS Text Agreement</h3>
            <p className="text-sm text-gray-600 mt-4 text-left">
              Rockstar Math SMS Notification & Alerts Agreement
            </p>
            <p className="text-left text-gray-600 text-sm mt-2">
              By providing your phone number during registration, you consent to receive SMS
              notifications, updates, and alerts related to your tutoring sessions, payment
              confirmations, and important announcements from Rockstar Math.
            </p>
            <p className="text-left text-gray-600 text-sm mt-2">
              <strong>Opt-Out Instructions:</strong>
              <br />
              ● To stop SMS notifications, reply STOP to any message.
              <br />● For further assistance, contact us at x@gmail.com.
            </p>
            <button
              onClick={handleAgreeSms}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-md"
            >
              I AGREE
            </button>
          </div>
        </div>
      )}

      {/* ✅ OTP Popup */}
      {isOtpPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-96 text-center">
            <h3 className="text-2xl font-bold text-gray-800">Enter Verification Code</h3>
            <p className="text-gray-500 text-sm mt-2">
              We've sent a code to{' '}
              <span className="text-blue-500 font-semibold">{formData.phone}</span>
            </p>

            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full tracking-widest text-2xl text-center font-bold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mt-4 py-3"
            />

            <button
              onClick={verifyOtp}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-md"
            >
              VERIFY
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterBeforeCheckout

import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ClassCard from '../components/ClassCard.jsx'
import Header from '../components/Header.jsx'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Guest', id: null }
  const [currentClasses, setCurrentClasses] = useState([])
  const [zoomMeeting, setZoomMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchasedClasses, setPurchasedClasses] = useState([]) // ✅ Fix: State Hook Added
  const navigate = useNavigate()
  const { users } = useAuth()

  useEffect(() => {
    if (!users) {
      navigate('/login') // 🚀 Redirect if not logged in
    }
  }, [user, navigate])

  // useEffect(() => {
  //   if (!users || !users._id) return;
  //   const fetchDashboardData = async () => {
  //     setLoading(true);
  //     try {
  //       // ✅ Fetch Purchased Classes
  //       const classResponse = await fetch(`https://rockstarmathfinal-production.up.railway.app/api/${users._id}/purchased-classes`);
  //       const classData = await classResponse.json();

  //       if (classResponse.ok && classData.purchasedClasses) {
  //         setCurrentClasses(classData.purchasedClasses);
  //       }

  //       // ✅ Fetch Zoom Meeting if user has a subscription
  //       const zoomResponse = await fetch(`https://rockstarmathfinal-production.up.railway.app/api/${users._id}/zoom-meeting`);
  //       const zoomData = await zoomResponse.json();

  //       if (zoomResponse.ok && zoomData.meeting) {
  //         setZoomMeeting(zoomData.meeting);
  //       } else {
  //         setZoomMeeting(null);
  //       }
  //     } catch (error) {
  //       console.error("❌ Error fetching dashboard data:", error);
  //       setError("Failed to load data. Please try again later.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDashboardData();
  // }, [users]);
console.log(users);

  useEffect(() => {
    const fetchPurchasedClasses = async () => {
        try {
            console.log("🔍 Fetching Purchased Classes...");
            const response = await axios.get(`https://rockstarmathfinal-production.up.railway.app/api/${users._id}/purchased-classes`);
            
            console.log("✅ Purchased Classes Fetched:", response.data);
            
            // ✅ Ensure correct data mapping
            if (response.data && response.data.purchasedClasses) {
                setPurchasedClasses(response.data.purchasedClasses);
            } else {
                console.error("❌ API Response doesn't have purchasedClasses:", response.data);
            }
            
        } catch (error) {
            console.error("❌ Error fetching purchased classes:", error);
        }
    };

    fetchPurchasedClasses();

    // ✅ Auto-Refresh Every 5 Seconds for Real-Time Updates
    const interval = setInterval(fetchPurchasedClasses, 5000);
    return () => clearInterval(interval);
}, [users._id]);

  return (
    <div className="flex min-h-auto">
      <div className="flex-grow bg-gray-100">
        <AnimatedSection direction="right">
          {purchasedClasses.length > 0 ? (
            <ul>
              {purchasedClasses.map((item, index) => (
                <li key={index}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>📅 {new Date(item.purchaseDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No Purchased Classes</p>
          )}
          {/* ✅ Zoom Meeting Section */}
          {zoomMeeting ? (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg mt-11">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Your Upcoming Zoom Meeting:
              </h3>
              <p>
                <strong>Topic:</strong> {zoomMeeting.topic}
              </p>
              <p>
                <strong>Start Time:</strong> {new Date(zoomMeeting.startTime).toLocaleString()}
              </p>
              <a
                href={zoomMeeting.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                ➡️ Join Meeting
              </a>
            </section>
          ) : (
            <p className="mt-11">No Zoom meeting scheduled.</p>
          )}
        </AnimatedSection>
      </div>
    </div>
  )
}

export default Dashboard

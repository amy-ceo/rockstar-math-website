import React, { useEffect, useState } from "react";
import Sidebar from '../components/Sidebar';
import ClassCard from '../components/ClassCard.jsx';
import Header from '../components/Header.jsx';
import AnimatedSection from "../components/AnimatedSection.jsx";
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { name: 'Guest', id: null };
  const [currentClasses, setCurrentClasses] = useState([]);
  const [zoomMeeting, setZoomMeeting] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { users } = useAuth();

  useEffect(() => {
    if (!users || !users._id) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // ✅ Fetch Purchased Classes
        const classResponse = await fetch(`http://localhost:5000/api/users/${users._id}/purchased-classes`);
        const classData = await classResponse.json();
        
        if (classResponse.ok && classData.purchasedClasses) {
          setCurrentClasses(classData.purchasedClasses);
        }

        // ✅ Fetch Zoom Meeting if user has a subscription
        const zoomResponse = await fetch(`http://localhost:5000/api/users/${users._id}/zoom-meeting`);
        const zoomData = await zoomResponse.json();
        
        if (zoomResponse.ok && zoomData.meeting) {
          setZoomMeeting(zoomData.meeting);
        } else {
          setZoomMeeting(null);
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [users]);

  return (
    <div className="flex min-h-auto">
      <div className="flex-grow bg-gray-100">
        <AnimatedSection direction="right">
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Here are your purchased classes:</h3>
            {loading ? (
              <p className="text-gray-600">Loading classes...</p>
            ) : currentClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentClasses.map((cls, index) => <ClassCard key={index} classData={cls} />)}
              </div>
            ) : (
              <p>No purchased classes yet.</p>
            )}
          </section>

          {/* ✅ Zoom Meeting Section */}
          {zoomMeeting ? (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg mt-11">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Upcoming Zoom Meeting:</h3>
              <p><strong>Topic:</strong> {zoomMeeting.topic}</p>
              <p><strong>Start Time:</strong> {new Date(zoomMeeting.startTime).toLocaleString()}</p>
              <a href={zoomMeeting.joinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                ➡️ Join Meeting
              </a>
            </section>
          ) : (
            <p className="mt-11">No Zoom meeting scheduled.</p>
          )}
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Dashboard;

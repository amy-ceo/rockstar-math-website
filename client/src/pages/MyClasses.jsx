import React, { useEffect, useState } from 'react'
import ClassCard from '../components/ClassCard'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import { useAuth } from '../context/AuthContext';

const MyClasses = () => {
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
         const classResponse = await fetch(`https://rockstarmathfinal-production.up.railway.app/api/${users._id}/purchased-classes`);
         const classData = await classResponse.json();
         
         if (classResponse.ok && classData.purchasedClasses) {
           setCurrentClasses(classData.purchasedClasses);
         }
 
         // ✅ Fetch Zoom Meeting if user has a subscription
         const zoomResponse = await fetch(`https://rockstarmathfinal-production.up.railway.app/api/${users._id}/zoom-meeting`);
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
    <section>
      <AnimatedSection direction='right'>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Here are your current classes:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentClasses.map((cls) => (
          <ClassCard key={cls.id} classData={cls} />
        ))}
      </div>
      <div className='flex justify-center items-center py-16'>
      <Link to={'/services'} className='bg-deepBlue py-3 px-8 text-white rounded-full hover:bg-sky-600'>Purchase More Courses</Link>
      </div>
      </AnimatedSection>
    </section>
  )
}

export default MyClasses

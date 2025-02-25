import React, { useEffect, useState } from "react";
import axios from "axios";

const UpcomingClasses = () => {
  const [classes, setClasses] = useState([]); // Default to an empty array

  useEffect(() => {
    axios.get("https://backend-production-cbe2.up.railway.app/api/classes/upcoming")
      .then((res) => {
        console.log("API Response:", res.data); // Debugging API response
        setClasses(Array.isArray(res.data) ? res.data : []); // Ensure it's always an array
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
        setClasses([]); // Set empty array on error to prevent `.map` error
      });
  }, []);

  return (
    <div>
      <h2>Upcoming Classes</h2>
      {classes.length === 0 ? (
        <p>No upcoming classes available.</p>
      ) : (
        classes.map((cls) => (
          <div key={cls._id} className="class-card">
            <p>Student: {cls?.studentId?.name || "Unknown"}</p>
            <p>Time: {new Date(cls.timeSlot).toLocaleString()}</p>
            <p>Zoom Link: <a href={cls.zoomLink}>Join</a></p>
          </div>
        ))
      )}
    </div>
  );
};

export default UpcomingClasses;

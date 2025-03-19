import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { FaUndo, FaArchive, FaClock } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast' // ✅ React-Hot-Toast for notifications

const Archive = () => {
  const { users } = useAuth() // ✅ Get logged-in user from AuthContext
  const [archivedClasses, setArchivedClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ✅ Fetch Archived Classes
  // ✅ Fetch Archived Classes (Calendly & Zoom)
  const fetchArchivedClasses = async () => {
    if (!users || !users._id) {
      console.error('❌ User ID not available!')
      setError('User authentication required.')
      setLoading(false)
      return
    }

    try {
      console.log('📡 Fetching archived classes for user:', users._id)
      const response = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/${users._id}/archived-classes`,
      )
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Failed to fetch archived data.')

      console.log('📥 Archived Classes Response:', data)

      // ✅ Separate Calendly and Zoom Sessions
      setArchivedClasses(data.archivedClasses || [])
      setError('')
    } catch (error) {
      console.error('❌ Error fetching archived data:', error)
      setError('Error loading archived classes. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedClasses()
  }, [users])

  // ✅ **Restore Function**
  // const handleRestore = async (className) => {
  //   if (!window.confirm(`Are you sure you want to restore ${className}?`)) return;

  //   try {
  //     console.log("📤 Sending restore request for:", className);

  //     const response = await fetch(
  //       `https://backend-production-cbe2.up.railway.app/api/restore-class`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ userId: users._id, className }),
  //       }
  //     );

  //     const data = await response.json();
  //     console.log("📥 Restore API Response:", data); // ✅ Debugging log

  //     if (!response.ok) throw new Error(data.message || "Failed to restore class.");

  //     // ✅ Remove Restored Class from Archived List
  //     setArchivedClasses((prev) => prev.filter((c) => c.name !== className));

  //     toast.success(`✅ ${className} restored successfully!`);
  //   } catch (error) {
  //     console.error("❌ Error restoring class:", error);
  //     toast.error("Failed to restore class. Try again.");
  //   }
  // };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <h3 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <FaArchive className="text-blue-500" /> Archived Classes & Expired Sessions
      </h3>

      {loading ? (
        <p className="text-gray-600 text-lg">Loading archived data...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : archivedClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {archivedClasses.map((classItem, index) => (
            <div
              key={index}
              className="bg-white border p-5 rounded-lg shadow-lg transition transform hover:scale-105 hover:shadow-xl"
            >
              <h4 className="text-xl font-semibold text-gray-800">{classItem.name}</h4>
              <p className="text-gray-600 mt-1">{classItem.description}</p>
              <p className="text-gray-500 text-sm mt-2">
                📅 Archived On:{' '}
                <strong>{new Date(classItem.archivedAt || Date.now()).toLocaleDateString()}</strong>
              </p>

              {/* ✅ Show if it was a Zoom Session */}
              {classItem.source === 'zoom' && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  🎥 <span className="text-blue-600">Zoom Session</span>
                </p>
              )}

              {/* ✅ Show if it was a Calendly Session */}
              {classItem.source !== 'zoom' && (
                <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                  <FaClock className="text-gray-500" /> Expired Calendly Session
                </p>
              )}

              {/* ✅ Show Meeting Link if available */}
              {classItem.zoomMeetingLink && (
                <a
                  href={classItem.zoomMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline mt-2 block"
                >
                  🔗 View Session Details
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-lg">No archived classes or expired sessions found.</p>
      )}
    </div>
  )
}

export default Archive

import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../components/ClassCard.jsx'

const Dashboard = () => {
  const { users } = useAuth() // ✅ Use AuthContext properly
  const navigate = useNavigate()
  const [purchasedClasses, setPurchasedClasses] = useState([])
  const [zoomMeeting, setZoomMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!users) {
      navigate('/login') // 🚀 Redirect if not logged in
    }
  }, [users, navigate])

  useEffect(() => {
    if (!users || !users._id) return

    const fetchPurchasedClasses = async () => {
      setLoading(true)
      try {
        const response = await fetch(`https://frontend-production-9912.up.railway.app/api/${users._id}/purchased-classes`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'Failed to fetch purchased classes.')

        setPurchasedClasses(data.purchasedClasses || [])
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setError('Failed to load classes. Try again.')
      }
    }

    const fetchZoomMeeting = async () => {
      try {
        const response = await fetch(`https://frontend-production-9912.up.railway.app/api/${users._id}/zoom-meeting`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'No Zoom meeting found.')

        setZoomMeeting(data.meeting)
      } catch (error) {
        console.error('❌ Error fetching Zoom meeting:', error)
        setZoomMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedClasses()
    fetchZoomMeeting()
  }, [users])

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex min-h-auto">
      <div className="flex-grow bg-gray-100">
        <AnimatedSection direction="right">
          {purchasedClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {purchasedClasses.map((classItem, index) => (
                <ClassCard key={index} classData={classItem} />
              ))}
            </div>
          ) : (
            <p>No Purchased Classes</p>
          )}
          {zoomMeeting && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3>Your Upcoming Zoom Meeting:</h3>
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
          )}
        </AnimatedSection>
      </div>
    </div>
  )
}

export default Dashboard

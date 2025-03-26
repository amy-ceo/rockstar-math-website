import React, { useEffect, useState } from 'react'
import ClassCard from '../components/ClassCard'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import { useAuth } from '../context/AuthContext'

const MyClasses = () => {
  const { users } = useAuth() // ✅ Get authenticated user
  const [currentClasses, setCurrentClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!users || !users._id) {
      console.error('❌ User data is missing:', users)
      setError('User not found. Please log in again.')
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        console.log('🔄 Fetching purchased classes for User ID:', users._id)

        // Fetch Purchased Classes
        const classResponse = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/${users._id}/purchased-classes`,
        )
        const classData = await classResponse.json()

        if (!classResponse.ok) throw new Error(classData.message || 'Failed to fetch classes.')

        console.log('✅ Purchased Classes Fetched:', classData)
        setCurrentClasses(classData.purchasedClasses || [])
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setError('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [users])

  // ✅ Handle Archiving of Class
  const handleArchive = async (className) => {
    if (!users || !users._id) {
      alert('User not found. Please log in again.')
      return
    }

    try {
      console.log(`📂 Archiving class: ${className} for user: ${users._id}`)

      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/archive-class',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: users._id, className }),
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to archive class.')

      console.log('✅ Class archived successfully:', data)

      // ✅ Remove Archived Class from UI
      setCurrentClasses((prev) => prev.filter((c) => c.name !== className))
      alert(`📂 ${className} archived successfully!`)
    } catch (error) {
      console.error('❌ Error archiving class:', error)
      alert('Failed to archive class. Try again.')
    }
  }

  return (
    <section>
      <AnimatedSection direction="right">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Here are your current classes:</h3>

        {/* ✅ Show Classes */}
        {loading ? (
          <p>Loading classes...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : currentClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentClasses.map((cls) => (
              <ClassCard
                key={cls._id}
                classData={cls}
                userId={users._id} // ✅ Fix: Ensure userId is passed
                setPurchasedClasses={setCurrentClasses} // ✅ Fix: Ensure state updates
              />
            ))}
          </div>
        ) : (
          <p>No purchased classes.</p>
        )}

        {/* ✅ Purchase More Courses Button */}
        <div className="flex justify-center items-center py-16">
          <Link
            to={'/services'}
            className="bg-deepBlue py-3 px-8 text-white rounded-full hover:bg-sky-600"
          >
            Purchase More Courses
          </Link>
        </div>
      </AnimatedSection>
    </section>
  )
}

export default MyClasses

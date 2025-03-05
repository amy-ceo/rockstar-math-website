import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaTrash, FaStickyNote } from 'react-icons/fa' // Added note icon
import { MdClose } from 'react-icons/md'

const API_BASE_URL = 'https://backend-production-cbe2.up.railway.app' // ✅ Ensure correct API URL

const UpcomingClasses = () => {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [note, setNote] = useState('') // ✅ State for note input
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/booked-sessions`)
        console.log('API Response:', response.data)

        if (response.data && Array.isArray(response.data.sessions)) {
          setSessions(response.data.sessions)
        } else {
          console.error('Invalid API response:', response.data)
          setSessions([])
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setSessions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  // Open Cancel Modal
  const openModal = (session) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }

  // Close Cancel Modal
  const closeModal = () => {
    setSelectedSession(null)
    setIsModalOpen(false)
  }

  // Cancel Session
  const cancelSession = async () => {
    if (!selectedSession) return

    try {
      await axios.post(`${API_BASE_URL}/api/admin/cancel-session`, {
        userId: selectedSession.userId,
        sessionId: selectedSession.sessionId,
      })

      setSessions(sessions.filter((session) => session.sessionId !== selectedSession.sessionId))

      alert('Session cancelled successfully & email sent to the user!')
      closeModal()
    } catch (error) {
      console.error('Error cancelling session:', error)
      alert('Failed to cancel session.')
    }
  }

  // Open Note Modal
  const openNoteModal = (session) => {
    setSelectedSession(session)
    setNote(session.note || '') // Load existing note if any
    setIsNoteModalOpen(true)
  }

  // Close Note Modal
  const closeNoteModal = () => {
    setSelectedSession(null)
    setIsNoteModalOpen(false)
    setNote('')
  }

  // Save Note
  const saveNote = async () => {
    if (!selectedSession) return

    try {
      await axios.post(`${API_BASE_URL}/api/admin/add-note`, {
        userId: selectedSession.userId,
        startTime: selectedSession.startTime, // ✅ Updated Field
        note,
      });

      if (response.data.success) {
        setSessions(
          sessions.map((session) =>
            session.sessionId === selectedSession.sessionId ? { ...session, note } : session,
          ),
        )

        alert('Note added successfully!')
      } else {
        alert('Failed to save note.')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note.')
    }

    closeNoteModal()
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Upcoming Classes</h2>

      {loading ? (
        <p className="text-center text-gray-500 text-lg">Loading sessions...</p>
      ) : sessions?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Event Name</th>
                <th className="px-4 py-3 text-left">Start Time</th>
                <th className="px-4 py-3 text-left">End Time</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.sessionId} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-3">{session.eventName}</td>
                  <td className="px-4 py-3">{new Date(session.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(session.endTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{session.userName}</span>
                    <br />
                    <span className="text-sm text-gray-500">{session.userEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-center flex gap-3 justify-center">
                    <button
                      onClick={() => openModal(session)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      <FaTrash /> Cancel
                    </button>
                    <button
                      onClick={() => openNoteModal(session)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      <FaStickyNote /> Add Note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg">No upcoming sessions available.</p>
      )}

      {/* ✅ MODAL FOR SESSION CANCELLATION */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Cancel Session?</h3>
            <p className="text-gray-600">
              Are you sure you want to cancel this session:{' '}
              <span className="font-semibold">{selectedSession?.eventName || 'Unknown'}</span>?
            </p>
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={cancelSession}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL FOR ADDING NOTE */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={closeNoteModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Note</h3>
            <textarea
              className="w-full border rounded p-2 text-gray-700"
              placeholder="Write a note for the user..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={closeNoteModal}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpcomingClasses

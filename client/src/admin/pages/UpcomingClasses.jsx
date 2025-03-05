import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaTrash, FaStickyNote } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'
import { toast } from 'react-hot-toast'

const API_BASE_URL = 'https://backend-production-cbe2.up.railway.app'

const UpcomingClasses = () => {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [note, setNote] = useState('')
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

      toast.success('Session cancelled successfully & email sent to the user!')
      closeModal()
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error('Failed to cancel session.')
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

  // Save or Update Note
  const saveNote = async () => {
    if (!selectedSession) return

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/add-note`, {
        userId: selectedSession.userId,
        startTime: selectedSession.startTime,
        note,
      })

      if (response.data.success) {
        setSessions(
          sessions.map((session) =>
            session.startTime === selectedSession.startTime
              ? { ...session, note }
              : session
          )
        )

        toast.success('Note saved successfully!')
      } else {
        toast.error('Failed to save note.')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note.')
    }

    closeNoteModal()
  }

  // Delete Note
  const deleteNote = async (session) => {
    if (!session) return

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/delete-note`, {
        userId: session.userId,
        startTime: session.startTime,
      })

      if (response.data.success) {
        setSessions(
          sessions.map((s) =>
            s.startTime === session.startTime ? { ...s, note: '' } : s
          )
        )

        toast.success('Note deleted successfully!')
      } else {
        toast.error('Failed to delete note.')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note.')
    }
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
                      className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                        session.note ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      <FaStickyNote /> {session.note ? 'Edit Note' : 'Add Note'}
                    </button>
                    {session.note && (
                      <button
                        onClick={() => deleteNote(session)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                      >
                        ❌ Delete Note
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg">No upcoming sessions available.</p>
      )}
    </div>
  )
}

export default UpcomingClasses

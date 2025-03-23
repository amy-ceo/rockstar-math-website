import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaTrash, FaStickyNote } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'
import toast, { Toaster } from 'react-hot-toast'
import 'react-toastify/dist/ReactToastify.css'

const API_BASE_URL = 'https://backend-production-cbe2.up.railway.app' // ✅ Ensure correct API URL

const UpcomingClasses = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Calendly Note Modal
  const [isCalendlyNoteModalOpen, setIsCalendlyNoteModalOpen] = useState(false);
  const [calendlyNoteText, setCalendlyNoteText] = useState('');

  // Zoom Note Modal
  const [isZoomNoteModalOpen, setIsZoomNoteModalOpen] = useState(false);
  const [zoomNoteText, setZoomNoteText] = useState('');
  const [selectedZoomSessionId, setSelectedZoomSessionId] = useState('');
  const [selectedZoomDate, setSelectedZoomDate] = useState('');

  const [loading, setLoading] = useState(true);

  // ✅ Fetch sessions (Calendly + Zoom) from your backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/booked-sessions`);
        console.log('📢 API Response:', response.data);

        if (response.data && Array.isArray(response.data.sessions)) {
          setSessions(response.data.sessions);
        } else {
          console.error('❌ Invalid API response:', response.data);
          setSessions([]);
        }
      } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  console.log('🔍 Current Sessions:', sessions);

  // -------------------------------------------
  // CANCEL SESSION
  // -------------------------------------------
  const openCancelModal = (session) => {
    setSelectedSession(session);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setSelectedSession(null);
    setIsCancelModalOpen(false);
  };

  const cancelSession = async () => {
    if (!selectedSession) return;

    try {
      if (selectedSession.type === 'zoom') {
        // For Zoom, we pass sessionDate
        await axios.post(`${API_BASE_URL}/api/admin/cancel-zoom-session`, {
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
          sessionDate: selectedSession.startTime,
        });
      } else {
        // For Calendly
        await axios.post(`${API_BASE_URL}/api/admin/cancel-session`, {
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
        });
      }

      // Remove the canceled session from local state
      setSessions((prev) =>
        prev.filter(
          (s) =>
            !(
              s.sessionId === selectedSession.sessionId &&
              s.startTime === selectedSession.startTime
            )
        )
      );

      toast.success('Session cancelled successfully!');
      closeCancelModal();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session.');
    }
  };

  // -------------------------------------------
  // CALENDLY NOTE MODAL & SAVE
  // -------------------------------------------
  const openCalendlyNoteModal = (session) => {
    setSelectedSession(session);
    setCalendlyNoteText(session.note || '');
    setIsCalendlyNoteModalOpen(true);
  };

  const closeCalendlyNoteModal = () => {
    setSelectedSession(null);
    setCalendlyNoteText('');
    setIsCalendlyNoteModalOpen(false);
  };

  const saveCalendlyNote = async () => {
    if (!selectedSession) return;

    try {
      // POST /api/admin/add-note for Calendly
      const payload = {
        userId: selectedSession.userId,
        sessionId: selectedSession.sessionId,
        startTime: selectedSession.startTime,
        note: calendlyNoteText,
      };

      const response = await axios.post(`${API_BASE_URL}/api/admin/add-note`, payload);
      if (response.data.success) {
        // Update local sessions array
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === selectedSession.sessionId && s.startTime === selectedSession.startTime
              ? { ...s, note: calendlyNoteText }
              : s
          )
        );
        toast.success(selectedSession.note ? 'Note updated successfully!' : 'Note added successfully!');
      } else {
        toast.error('Failed to save note.');
      }
    } catch (error) {
      console.error('Error saving Calendly note:', error);
      toast.error('Failed to save note.');
    }

    closeCalendlyNoteModal();
  };

  // -------------------------------------------
  // ZOOM NOTE MODAL & SAVE
  // -------------------------------------------
  const openZoomNoteModal = (session) => {
    setSelectedZoomSessionId(session.sessionId);
    setSelectedZoomDate(session.startTime);
    setZoomNoteText(session.note || '');
    setIsZoomNoteModalOpen(true);
  };

  const closeZoomNoteModal = () => {
    setSelectedZoomSessionId('');
    setSelectedZoomDate('');
    setZoomNoteText('');
    setIsZoomNoteModalOpen(false);
  };

  const saveZoomNote = async () => {
    if (!selectedZoomSessionId || !selectedZoomDate) {
      toast.error('Missing session info!');
      return;
    }
    try {
      // POST /api/admin/add-zoom-note for Zoom
      const payload = {
        userId: selectedSession?.userId, // or store userId separately
        sessionId: selectedZoomSessionId,
        date: selectedZoomDate,
        note: zoomNoteText,
      };

      const response = await axios.post(`${API_BASE_URL}/api/admin/add-zoom-note`, payload);
      if (!response.data.success) {
        toast.error('Failed to save note.');
        return;
      }

      toast.success('Note saved successfully!');

      // Update local state so the new note shows instantly
      setSessions((prev) =>
        prev.map((s) =>
          // Match by sessionId + startTime
          s.sessionId === selectedZoomSessionId && s.startTime === selectedZoomDate
            ? { ...s, note: zoomNoteText }
            : s
        )
      );

      closeZoomNoteModal();
    } catch (error) {
      console.error('❌ Error saving zoom note:', error);
      toast.error('Failed to save note.');
    }
  };

  // -------------------------------------------
  // RENDER
  // -------------------------------------------
  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />

      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Upcoming Classes</h2>

      {loading ? (
        <p className="text-center text-gray-500 text-lg">Loading sessions...</p>
      ) : sessions.length > 0 ? (
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
                <tr
                  key={`${session.sessionId}-${session.startTime}`} // Unique key for multi-date Zoom
                  className="border-b hover:bg-gray-100"
                >
                  <td className="px-4 py-3">{session.eventName}</td>
                  <td className="px-4 py-3">{new Date(session.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {session.endTime
                      ? new Date(session.endTime).toLocaleString()
                      : new Date(session.startTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{session.userName}</span>
                  </td>
                  <td className="px-4 py-3 text-center flex gap-3 justify-center">
                    {/* Cancel Button */}
                    <button
                      onClick={() => openCancelModal(session)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      <FaTrash /> Cancel
                    </button>

                    {/* Add/Edit Note Button */}
                    {session.type === 'zoom' ? (
                      <button
                        onClick={() => openZoomNoteModal(session)}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          session.note ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                      >
                        <FaStickyNote /> {session.note ? 'Edit Note' : 'Add Note'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openCalendlyNoteModal(session)}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          session.note ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                      >
                        <FaStickyNote /> {session.note ? 'Edit Note' : 'Add Note'}
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

      {/* ---------------------------------------------------------------- */}
      {/* CANCEL SESSION MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Cancel</h3>
            <p>Are you sure you want to cancel this session?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                No
              </button>
              <button
                onClick={cancelSession}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CALENDLY NOTE MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isCalendlyNoteModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Add/Edit Note (Calendly)</h3>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Enter note here..."
              value={calendlyNoteText}
              onChange={(e) => setCalendlyNoteText(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeCalendlyNoteModal}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
              <button
                onClick={saveCalendlyNote}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ZOOM NOTE MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isZoomNoteModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Add/Edit Note (Zoom)</h3>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Enter note here..."
              value={zoomNoteText}
              onChange={(e) => setZoomNoteText(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeZoomNoteModal}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
              <button
                onClick={saveZoomNote}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingClasses;

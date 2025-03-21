import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaStickyNote } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import toast, { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "https://backend-production-cbe2.up.railway.app"; // ✅ Ensure correct API URL

const UpcomingClasses = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch sessions with latest notes (Both Calendly & Zoom)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/booked-sessions`);
        console.log("📢 API Response:", response.data);

        if (response.data && Array.isArray(response.data.sessions)) {
          setSessions(response.data.sessions);
        } else {
          console.error("❌ Invalid API response:", response.data);
          setSessions([]);
        }
      } catch (error) {
        console.error("❌ Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  console.log("🔍 Current Sessions:", sessions);

  // ✅ Open Cancel Modal
  const openCancelModal = (session) => {
    setSelectedSession(session);
    setIsCancelModalOpen(true);
  };

  // ✅ Close Cancel Modal
  const closeCancelModal = () => {
    setSelectedSession(null);
    setIsCancelModalOpen(false);
  };

  // ✅ Cancel Session (Supports both Calendly & Zoom)
  const cancelSession = async () => {
    if (!selectedSession) return;

    try {
      if (selectedSession.type === "zoom") {
        await axios.post(`${API_BASE_URL}/api/admin/cancel-zoom-session`, {
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/cancel-session`, {
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
        });
      }

      setSessions(sessions.filter((session) => session.sessionId !== selectedSession.sessionId));
      toast.success("Session cancelled successfully!");
      closeCancelModal();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error("Failed to cancel session.");
    }
  };

  // ✅ Open Note Modal
  const openNoteModal = (session) => {
    setSelectedSession(session);
    setNote(session.note || "");
    setIsNoteModalOpen(true);
  };

  // ✅ Close Note Modal
  const closeNoteModal = () => {
    setSelectedSession(null);
    setIsNoteModalOpen(false);
    setNote("");
  };

  // ✅ Save or Update Note (Supports both Zoom & Calendly)
  const saveNote = async () => {
    if (!selectedSession) return;

    try {
      const endpoint = selectedSession.type === "zoom" ? "add-zoom-note" : "add-note";

      const response = await axios.post(`${API_BASE_URL}/api/admin/${endpoint}`, {
        userId: selectedSession.userId,
        sessionId: selectedSession.sessionId,
        startTime: selectedSession.startTime, // ✅ Add missing startTime field
        note,
      });

      if (response.data.success) {
        setSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.sessionId === selectedSession.sessionId ? { ...session, note } : session
          )
        );
        toast.success(selectedSession?.note ? "Note updated successfully!" : "Note added successfully!");
      } else {
        toast.error("Failed to save note.");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note.");
    }

    closeNoteModal();
  };

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
                <tr key={session.sessionId} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-3">{session.eventName}</td>
                  <td className="px-4 py-3">{new Date(session.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(session.endTime || session.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{session.userName}</span>
                  </td>
                  <td className="px-4 py-3 text-center flex gap-3 justify-center">
                    <button onClick={() => openCancelModal(session)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                      <FaTrash /> Cancel
                    </button>
                    <button onClick={() => openNoteModal(session)} className={`px-4 py-2 rounded-md flex items-center gap-2 ${session.note ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"} text-white`}>
                      <FaStickyNote /> {session.note ? "Edit Note" : "Add Note"}
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
        {/* Cancel Session Modal */}
        {isCancelModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Cancel</h3>
            <p>Are you sure you want to cancel this session?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeCancelModal} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md">
                No
              </button>
              <button onClick={cancelSession} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Add/Edit Note</h3>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Enter note here..."></textarea>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeNoteModal} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md">
                Close
              </button>
              <button onClick={saveNote} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
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

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const UpcomingClasses = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("/api/admin/booked-sessions");

        if (response.data && Array.isArray(response.data.sessions)) {
          setSessions(response.data.sessions);
        } else {
          console.error("Unexpected API response:", response.data);
          setSessions([]); // Fallback
        }

      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]); // Prevent undefined issue
      }
    };

    fetchSessions();
  }, []);

  const openModal = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSession(null);
    setIsModalOpen(false);
  };

  const cancelSession = async () => {
    if (!selectedSession) return;

    try {
      await axios.post("/api/admin/cancel-session", {
        userId: selectedSession.userId,
        sessionId: selectedSession.sessionId,
      });

      setSessions(sessions.filter(session => session.sessionId !== selectedSession.sessionId));

      alert("Session cancelled successfully & email sent to the user!");
      closeModal();
    } catch (error) {
      console.error("Error cancelling session:", error);
      alert("Failed to cancel session.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Upcoming Classes</h2>

      {sessions?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Event Name</th>
                <th className="px-4 py-3 text-left">Start Time</th>
                <th className="px-4 py-3 text-left">End Time</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-center">Action</th>
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openModal(session)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <FaTrash /> Cancel
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
              Are you sure you want to cancel this session:{" "}
              <span className="font-semibold">{selectedSession?.eventName || "Unknown"}</span>?
            </p>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-all"
              >
                No
              </button>
              <button
                onClick={cancelSession}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingClasses;

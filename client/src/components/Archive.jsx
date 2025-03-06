// import React, { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { FaUndo, FaArchive, FaClock } from "react-icons/fa";
// import toast, { Toaster } from "react-hot-toast"; // ✅ React-Hot-Toast for notifications

// const Archive = () => {
//   const { users } = useAuth(); // ✅ Get logged-in user from AuthContext
//   const [archivedClasses, setArchivedClasses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!users || !users._id) {
//       console.error("❌ User ID not available!");
//       setError("User authentication required.");
//       setLoading(false);
//       return;
//     }

//     const fetchArchivedData = async () => {
//       try {
//         const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/user/archived-classes/${users._id}`);
//         const data = await response.json();

//         if (!response.ok) throw new Error(data.message || "Failed to fetch archived data.");

//         setArchivedClasses(data.archivedClasses || []);
//       } catch (error) {
//         console.error("❌ Error fetching archived data:", error);
//         setError("Error loading archived classes. Try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchArchivedData();
//   }, [users]);

//   // ✅ **Restore Function**
//   const handleRestore = async (className) => {
//     if (!window.confirm(`Are you sure you want to restore ${className}?`)) return;

//     try {
//       const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/user/restore-class`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: users._id, className }),
//       });

//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || "Failed to restore class.");

//       // ✅ Remove Restored Class from Archived List
//       setArchivedClasses((prev) => prev.filter((c) => c.name !== className));

//       toast.success(`✅ ${className} restored successfully!`);
//     } catch (error) {
//       console.error("❌ Error restoring class:", error);
//       toast.error("Failed to restore class. Try again.");
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <Toaster position="top-center" reverseOrder={false} /> {/* ✅ React-Hot-Toast */}
//       <h3 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
//         <FaArchive className="text-blue-500" /> Archived Classes & Expired Sessions
//       </h3>

//       {/* ✅ Loading & Error Handling */}
//       {loading ? (
//         <p className="text-gray-600 text-lg">Loading archived data...</p>
//       ) : error ? (
//         <p className="text-red-600">{error}</p>
//       ) : archivedClasses.length > 0 ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {archivedClasses.map((classItem, index) => (
//             <div
//               key={index}
//               className="bg-white border p-5 rounded-lg shadow-lg transition transform hover:scale-105 hover:shadow-xl"
//             >
//               <h4 className="text-xl font-semibold text-gray-800">{classItem.name}</h4>
//               <p className="text-gray-600 mt-1">{classItem.description}</p>
//               <p className="text-gray-500 text-sm mt-2">
//                 📅 Archived On:{" "}
//                 <strong>{new Date(classItem.archivedAt || Date.now()).toLocaleDateString()}</strong>
//               </p>

//               {/* ✅ Calendly Booking Info (If Available) */}
//               {classItem.bookingLink && (
//                 <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
//                   <FaClock className="text-gray-500" /> Expired Calendly Session:{" "}
//                   <a href={classItem.bookingLink} target="_blank" rel="noopener noreferrer" className="underline">
//                     View Details
//                   </a>
//                 </p>
//               )}

//               {/* ✅ Restore Button */}
//               <button
//                 className="mt-4 bg-green-600 text-white py-2 px-4 rounded flex items-center gap-2 hover:bg-green-700 transition-all"
//                 onClick={() => handleRestore(classItem.name)}
//               >
//                 <FaUndo /> Restore
//               </button>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p className="text-gray-500 text-lg">No archived classes or expired sessions found.</p>
//       )}
//     </div>
//   );
// };

// export default Archive;

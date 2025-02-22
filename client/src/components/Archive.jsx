import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Archive = () => {
  const { users } = useAuth(); // ✅ Get user from AuthContext
  const [archivedClasses, setArchivedClasses] = useState([]);

  useEffect(() => {
    if (!users || !users._id) {
      console.error("❌ User ID not available!");
      return;
    }

    const fetchArchivedClasses = async () => {
      try {
        const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/${users._id}/archived-classes`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to fetch archived classes.");

        setArchivedClasses(data.archivedClasses || []);
      } catch (error) {
        console.error("❌ Error fetching archived classes:", error);
      }
    };

    fetchArchivedClasses();
  }, [users]);

  // ✅ **Restore Function**
  const handleRestore = async (className) => {
    try {
      const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/restore-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: users._id, className }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to restore class.");

      // ✅ Remove Restored Class from Archived List
      setArchivedClasses((prev) => prev.filter((c) => c.name !== className));

      alert(`✅ ${className} restored successfully!`);
    } catch (error) {
      console.error("❌ Error restoring class:", error);
      alert("Failed to restore class. Try again.");
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">📂 Archived Classes</h3>
      {archivedClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {archivedClasses.map((classItem, index) => (
            <div key={index} className="bg-white border p-4 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold">{classItem.name}</h4>
              <p className="text-sm text-gray-600">{classItem.description}</p>
              <p className="text-sm text-gray-500">Archived On: {new Date(classItem.archivedDate || Date.now()).toLocaleDateString()}</p>

              {/* ✅ Restore Button */}
              <button
                className="mt-3 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-all"
                onClick={() => handleRestore(classItem.name)}
              >
                🔄 Restore
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No archived classes found.</p>
      )}
    </div>
  );
};

export default Archive;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({ username: '', email: '', phone: '' });

  // ✅ Fetch all users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://backend-production-cbe2.up.railway.app/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`https://backend-production-cbe2.up.railway.app/api/admin/users/${userId}`);
      toast.success('User deleted successfully.');
      setUsers(users.filter((user) => user._id !== userId)); // Remove from UI instantly
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
    }
  };

  // ✅ Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditData({ username: user.username, email: user.billingEmail, phone: user.phone });
  };

  // ✅ Handle update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://backend-production-cbe2.up.railway.app/api/admin/users/${selectedUser._id}`, editData);
      toast.success('User updated successfully.');
      setUsers(users.map((user) => (user._id === selectedUser._id ? { ...user, ...editData } : user))); // Update UI instantly
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Toaster position="top-right" />
      <div className="container mx-auto p-6 flex-grow">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Admin - Manage Users</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 border">Username</th>
                  <th className="py-3 px-4 border">Email</th>
                  <th className="py-3 px-4 border">Phone</th>
                  <th className="py-3 px-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="text-center border-b">
                    <td className="py-3 px-4">{user.username}</td>
                    <td className="py-3 px-4">{user.billingEmail}</td>
                    <td className="py-3 px-4">{user.phone}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEditModal(user)}
                        className="mr-2 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition duration-200"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition duration-200"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Edit User</h3>
            <form onSubmit={handleUpdateUser}>
              <label className="block mb-2 text-gray-600">Username:</label>
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <label className="block mb-2 text-gray-600">Email:</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <label className="block mb-2 text-gray-600">Phone:</label>
              <input
                type="text"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 transition duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

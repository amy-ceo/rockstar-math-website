import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

const AdminNewsLetter = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editEmail, setEditEmail] = useState("");
    const [editId, setEditId] = useState(null);

    // Fetch all subscribers
    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const response = await axios.get("https://backend-production-cbe2.up.railway.app/api/subscribers");
            setSubscribers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching subscribers", error);
            setLoading(false);
        }
    };

    // Delete subscriber
    const deleteSubscriber = async (id) => {
        try {
            await axios.delete(`https://backend-production-cbe2.up.railway.app/api/subscribers/${id}`);
            setSubscribers(subscribers.filter(sub => sub._id !== id));
        } catch (error) {
            console.error("Error deleting subscriber", error);
        }
    };

    // Edit subscriber
    const editSubscriber = (id, email) => {
        setEditId(id);
        setEditEmail(email);
    };

    // Update subscriber
    const updateSubscriber = async () => {
        try {
            await axios.put(`https://backend-production-cbe2.up.railway.app/api/subscribers/${editId}`, { email: editEmail });
            setSubscribers(subscribers.map(sub => sub._id === editId ? { ...sub, email: editEmail } : sub));
            setEditId(null);
            setEditEmail("");
        } catch (error) {
            console.error("Error updating subscriber", error);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <div className="flex-grow container mx-auto p-6">
                <h2 className="text-2xl font-semibold mb-4">Admin - Manage Subscribers</h2>
                <div className="overflow-x-auto bg-white p-4 shadow-md rounded-lg">
                    <table className="w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr className="text-left">
                                <th className="p-3 border border-gray-200">Email</th>
                                <th className="p-3 border border-gray-200">Subscribed At</th>
                                <th className="p-3 border border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="text-center p-4">Loading...</td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr key={sub._id} className="border-b border-gray-200">
                                        <td className="p-3 border border-gray-200">
                                            {editId === sub._id ? (
                                                <input
                                                    type="text"
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                sub.email
                                            )}
                                        </td>
                                        <td className="p-3 border border-gray-200">{new Date(sub.subscribedAt).toLocaleString()}</td>
                                        <td className="p-3 border border-gray-200">
                                            {editId === sub._id ? (
                                                <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600" onClick={updateSubscriber}>
                                                    Save
                                                </button>
                                            ) : (
                                                <>
                                                    <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600" onClick={() => editSubscriber(sub._id, sub.email)}>
                                                        <FaEdit />
                                                    </button>
                                                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => deleteSubscriber(sub._id)}>
                                                        <FaTrash />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        
        </div>
    );
};

export default AdminNewsLetter;

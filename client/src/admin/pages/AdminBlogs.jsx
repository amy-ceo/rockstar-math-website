import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaUpload } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal + Edit states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Form data states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null, // We'll store the File object here
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch blogs on mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(
        'https://backend-production-cbe2.up.railway.app/api/blogs'
      );
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading blogs:', error);
      toast.error('Failed to load blogs.');
      setLoading(false);
    }
  };

  // Handle deleting a blog
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await axios.delete(
        `https://backend-production-cbe2.up.railway.app/api/blogs/${id}`
      );
      toast.success('Blog deleted successfully.');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog.');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file)); // For local preview
    }
  };

  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();

   
  const formDataToSend = new FormData();
  formDataToSend.append("title", formData.title);
  formDataToSend.append("description", formData.description);

  if (formData.image) {
    formDataToSend.append("image", formData.image);
  }

  // Debug FormData
  for (let pair of formDataToSend.entries()) {
    console.log("FORMDATA:", pair[0], pair[1]);
  }
  
    try {
      if (editMode) {
        // Update existing blog
        await axios.put(
          `https://backend-production-cbe2.up.railway.app/api/blogs/${selectedBlog._id}`,
          formDataToSend,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Blog updated successfully.');
      } else {
        // Create new blog
        await axios.post(
          'https://backend-production-cbe2.up.railway.app/api/blogs',
          formDataToSend,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Blog created successfully.');
      }

      setModalOpen(false);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to save blog.');
    }
  };

  // Open modal in "Add" mode
  const handleAddNew = () => {
    setModalOpen(true);
    setEditMode(false);
    setSelectedBlog(null);
    setFormData({ title: '', description: '', image: null });
    setPreviewImage(null);
  };

  // Open modal in "Edit" mode
  const handleEdit = (blog) => {
    setModalOpen(true);
    setEditMode(true);
    setSelectedBlog(blog);

    // Fill in title/description, but set image to null (no new file yet)
    setFormData({
      title: blog.title,
      description: blog.description,
      image: null,
    });

    // Show the existing image in the preview
    setPreviewImage(blog.image);
  };

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />

      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin - Manage Blogs</h2>

      {/* Add Blog Button */}
      <button
        onClick={handleAddNew}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 flex items-center gap-2 shadow-md transition-all"
      >
        <FaPlus /> Add New Blog
      </button>

      {/* Blog Table */}
      {loading ? (
        <p className="text-gray-600 text-lg">Loading blogs...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-800">
                <th className="py-3 px-4 border">Title</th>
                <th className="py-3 px-4 border">Description</th>
                <th className="py-3 px-4 border">Image</th>
                <th className="py-3 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr
                  key={blog._id}
                  className="text-center hover:bg-gray-100 transition-all"
                >
                  <td className="py-3 px-4 border">{blog.title}</td>
                  <td className="py-3 px-4 border">
                    {blog.description.substring(0, 50)}...
                  </td>
                  <td className="py-3 px-4 border">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-20 h-12 object-cover rounded-lg shadow-md"
                    />
                  </td>
                  <td className="py-3 px-4 border">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="mr-2 bg-blue-500 text-white px-2 py-1 rounded shadow-md hover:bg-blue-600 transition-all"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded shadow-md hover:bg-red-600 transition-all"
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

      {/* Blog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit' : 'Add'} Blog
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                className="w-full p-3 border rounded mb-4 focus:ring focus:ring-blue-300"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="w-full p-3 border rounded mb-4 focus:ring focus:ring-blue-300"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <label className="block mb-2 text-gray-600">Upload Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full p-2 border rounded mb-4"
                  onChange={handleFileChange}
                />
                <FaUpload className="text-blue-500 text-lg" />
              </div>
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg shadow-md mb-4 border"
                />
              )}
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded shadow-md transition-all"
              >
                {editMode ? 'Update' : 'Create'} Blog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;

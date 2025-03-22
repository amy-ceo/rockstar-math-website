// controllers/blogController.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Blog = require('../models/Blog');

// 1. Configure Cloudinary using your .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Create a Cloudinary storage instance for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'blogs', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

// 3. Create the Multer middleware using Cloudinary storage
const upload = multer({ storage });

// ========== Controller Methods ==========

// GET all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

// CREATE a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageUrl = '';
    let imageId = '';

    // Cloudinary via Multer automatically sets req.file.path and req.file.filename
    if (req.file) {
      imageUrl = req.file.path;
      imageId = req.file.filename;
    }

    const newBlog = new Blog({
      title,
      description,
      image: imageUrl,
      imageId: imageId,
    });
    await newBlog.save();

    res.status(201).json({ message: 'Blog created successfully', newBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
};

// UPDATE an existing blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // If a new image is uploaded, delete the old one from Cloudinary
    if (req.file) {
      if (blog.imageId) {
        await cloudinary.uploader.destroy(blog.imageId);
      }
      blog.image = req.file.path;
      blog.imageId = req.file.filename;
    }

    blog.title = title;
    blog.description = description;

    const updatedBlog = await blog.save();
    res.json({ message: 'Blog updated successfully', updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};

// DELETE a blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Delete the image from Cloudinary if it exists
    if (blog.imageId) {
      await cloudinary.uploader.destroy(blog.imageId);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog and image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};

// Export the Multer upload middleware for routes
exports.upload = upload;

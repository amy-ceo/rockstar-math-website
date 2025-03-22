// controllers/blogController.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Blog = require('../models/Blog');

// 1. DEBUG: Log environment variables to ensure they're loaded
console.log("DEBUG Cloudinary ENV:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET, // just to check if it's not empty
});

// 2. Configure Cloudinary with your .env credentials
cloudinary.config({
  cloud_name: 'myapp', 
  api_key: '813831155681172',
  api_secret: 'QBbSy-eu93agoJp9a7YGRAd1GtA',
});

// 3. Create a Cloudinary storage instance for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'blogs', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

// 4. Create the Multer middleware using Cloudinary storage
const upload = multer({ storage });

// ========== Controller Methods ==========

// GET all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

// CREATE a new blog
exports.createBlog = async (req, res) => {
  try {
    console.log("DEBUG createBlog -> req.body:", req.body);
    console.log("DEBUG createBlog -> req.file:", req.file);

    const { title, description } = req.body;
    let imageUrl = '';
    let imageId = '';

    // Multer-Cloudinary automatically sets req.file.path (URL) and req.file.filename (public_id)
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
    console.error("Error creating blog:", error);
    res.status(500).json({
      message: 'Error creating blog',
      error: error.message,
      stack: error.stack
    });
  }
};

// UPDATE an existing blog
exports.updateBlog = async (req, res) => {
  try {
    console.log("DEBUG updateBlog -> req.body:", req.body);
    console.log("DEBUG updateBlog -> req.file:", req.file);

    const { title, description } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // If a new image is uploaded, delete the old one from Cloudinary
    if (req.file) {
      if (blog.imageId) {
        // Delete old image from Cloudinary
        await cloudinary.uploader.destroy(blog.imageId);
      }
      // Update with new image data
      blog.image = req.file.path;
      blog.imageId = req.file.filename;
    }

    blog.title = title;
    blog.description = description;

    const updatedBlog = await blog.save();
    res.json({ message: 'Blog updated successfully', updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      message: 'Error updating blog',
      error: error.message,
      stack: error.stack
    });
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
    console.error("Error deleting blog:", error);
    res.status(500).json({
      message: 'Error deleting blog',
      error: error.message,
      stack: error.stack
    });
  }
};

// Export the Multer upload middleware for routes
exports.upload = upload;

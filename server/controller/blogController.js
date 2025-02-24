const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');

// ✅ Configure Multer for image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store images in "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file
  },
});

const upload = multer({ storage });

// ✅ Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

// ✅ Create a new blog with image upload
exports.createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const newBlog = new Blog({ title, description, image: imagePath });
    await newBlog.save();

    res.status(201).json({ message: 'Blog created successfully', newBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error });
  }
};

// ✅ Update a blog (allow new image upload)
exports.updateBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    let updatedData = { title, description };

    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json({ message: 'Blog updated successfully', updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error });
  }
};

// ✅ Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};

// ✅ Export multer upload middleware
exports.upload = upload;

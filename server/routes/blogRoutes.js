// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controller/blogController');

// GET all blogs
router.get('/', blogController.getAllBlogs);

// CREATE a new blog (using 'image' as the form field name)
router.post('/', blogController.upload.single('image'), blogController.createBlog);

// UPDATE an existing blog
router.put('/:id', blogController.upload.single('image'), blogController.updateBlog);

// DELETE a blog
router.delete('/:id', blogController.deleteBlog);

module.exports = router;

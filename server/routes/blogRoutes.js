const express = require('express');
const router = express.Router();
const blogController = require('../controller/blogController'); // ✅ Ensure correct path

console.log("DEBUG: blogController", blogController); // 🔍 Debug to check the imported object

// ✅ Check if required functions exist
if (!blogController.getAllBlogs) {
  console.error("❌ ERROR: getAllBlogs function is missing from blogController");
}
if (!blogController.createBlog) {
  console.error("❌ ERROR: createBlog function is missing from blogController");
}
if (!blogController.updateBlog) {
  console.error("❌ ERROR: updateBlog function is missing from blogController");
}
if (!blogController.deleteBlog) {
  console.error("❌ ERROR: deleteBlog function is missing from blogController");
}

// ✅ GET all blogs
router.get('/', blogController.getAllBlogs);

// ✅ CREATE a new blog
router.post('/', blogController.upload.single('image'), blogController.createBlog);

// ✅ UPDATE an existing blog
router.put('/:id', blogController.upload.single('image'), blogController.updateBlog);

// ✅ DELETE a blog
router.delete('/:id', blogController.deleteBlog);

module.exports = router;

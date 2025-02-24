const express = require('express');
const { getAllBlogs, createBlog, updateBlog, deleteBlog, upload } = require('../controller/blogController');

const router = express.Router();

router.get('/', getAllBlogs);
router.post('/', upload.single('image'), createBlog);
router.put('/:id', upload.single('image'), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;

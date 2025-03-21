const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin'); // 🔥 Import Firebase Admin SDK

// ✅ Firebase Admin Setup
const serviceAccount = require('../firebaseServiceAccount.json'); // Ensure this file is present in your backend directory


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'rockstarmath-image-base.appspot.com', // Change this to your Firebase Storage bucket
});

const bucket = admin.storage().bucket();

// ✅ Configure Multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

// ✅ Function to Upload Image to Firebase
async function uploadToFirebase(file) {
  const destination = `blogs/${Date.now()}-${file.originalname}`;
  await bucket.upload(file.path, {
    destination,
    public: true,
    metadata: {
      firebaseStorageDownloadTokens: Date.now(),
    },
  });

  // Delete local file after upload
  fs.unlinkSync(file.path);

  // Return the Firebase Storage public URL
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}


// ✅ Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

// ✅ Create a new blog with Firebase image upload
exports.createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageUrl = '';

    if (req.file) {
      imageUrl = await uploadToFirebase(req.file);
    }

    const newBlog = new Blog({ title, description, image: imageUrl });
    await newBlog.save();

    res.status(201).json({ message: 'Blog created successfully', newBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error });
  }
};

// ✅ Update a blog with Firebase image upload
exports.updateBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    let updatedData = { title, description };

    // ✅ Delete old image from Firebase if a new one is uploaded
    if (req.file) {
      if (blog.image) {
        const filePath = blog.image.split('.com/')[1];
        const file = bucket.file(filePath);
        await file.delete();
        console.log('Old image deleted from Firebase:', filePath);
      }

      updatedData.image = await uploadToFirebase(req.file);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.json({ message: 'Blog updated successfully', updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error });
  }
};

// ✅ Delete a blog and remove image from Firebase
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // ✅ Delete image from Firebase
    if (blog.image) {
      const filePath = blog.image.split('.com/')[1];
      const file = bucket.file(filePath);
      await file.delete();
      console.log('Image deleted from Firebase:', filePath);
    }

    // ✅ Delete blog from database
    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog and image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};

// ✅ Export multer upload middleware
exports.upload = upload;

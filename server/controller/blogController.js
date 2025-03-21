const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load .env file
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

console.log("🔹 FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("🔹 FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);


const bucket = admin.storage().bucket();

const storage = multer.memoryStorage(); // 🔥 Use memory storage to avoid file system issues
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});


async function uploadToFirebase(file) {
  try {
    if (!file) throw new Error("No file provided for upload");

    const destination = `blogs/${Date.now()}-${file.originalname}`;
    const blob = bucket.file(destination);

    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        console.error("🔥 Firebase Storage Error:", error);
        reject(new Error("Image upload failed"));
      });

      blobStream.on("finish", async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        console.log("✅ Image Successfully Uploaded:", publicUrl);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer); // 🔥 Use buffer to write file to Firebase
    });
  } catch (error) {
    console.error("🔥 Firebase Upload Error:", error);
    throw new Error("Failed to upload image to Firebase");
  }
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

exports.createBlog = async (req, res) => {
  try {
    console.log("🔹 Received Blog Creation Request:", req.body);

    const { title, description } = req.body;
    let imageUrl = "";

    if (req.file) {
      console.log("🔹 Uploading Image to Firebase...");
      imageUrl = await uploadToFirebase(req.file);
      console.log("✅ Image Uploaded Successfully:", imageUrl);
    }

    const newBlog = new Blog({ title, description, image: imageUrl });
    await newBlog.save();

    console.log("✅ Blog Saved to Database:", newBlog);
    res.status(201).json({ message: "Blog created successfully", newBlog });
  } catch (error) {
    console.error("🔥 Error Creating Blog:", error);
    res.status(500).json({ message: "Error creating blog", error: error.message });
  }
};


exports.updateBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    let updatedData = { title, description };

    if (req.file) {
      if (blog.image) {
        try {
          const filePath = decodeURIComponent(blog.image.split(`${bucket.name}/`)[1]).replace(/\?.*$/, ""); // ✅ Proper Path Extraction
          const file = bucket.file(filePath);
          await file.delete();
          console.log("✅ Old image deleted from Firebase:", filePath);
        } catch (error) {
          console.error("🔥 Error deleting old image from Firebase:", error);
        }
      }

      // ✅ Ensure the new image is uploaded before updating the blog
      try {
        const newImageUrl = await uploadToFirebase(req.file);
        updatedData.image = newImageUrl;
      } catch (error) {
        return res.status(500).json({ message: 'Error uploading new image', error: error.message });
      }
      
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.json({ message: 'Blog updated successfully', updatedBlog });
  } catch (error) {
    console.error("🔥 Error updating blog:", error);
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};


// ✅ Delete a blog and remove image from Firebase
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.image) {
      try {
        const filePath = decodeURIComponent(blog.image.split(`${bucket.name}/`)[1]).replace(/\?.*$/, ""); // ✅ Removes query params
        const file = bucket.file(filePath);
        await file.delete();
        console.log("✅ Image deleted from Firebase:", filePath);
      } catch (error) {
        console.error("🔥 Error deleting image from Firebase:", error);
      }
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

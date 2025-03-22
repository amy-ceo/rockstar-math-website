require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Blog = require('../models/Blog');
const streamifier = require('streamifier'); // ✅ Needed to handle Buffer streams

// ✅ 1. DEBUG: Log Cloudinary environment variables
console.log("DEBUG Cloudinary ENV:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET,
});

// ✅ 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ 1. DEBUG: Log Cloudinary environment variables
console.log("DEBUG Cloudinary ENV:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET, // ✅ Checks if secret exists but does NOT log it
});

// ✅ 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ 3. Test Cloudinary Authentication
cloudinary.api.ping()
  .then(result => console.log("✅ Cloudinary Authentication Successful:", result))
  .catch(error => console.error("❌ Cloudinary Authentication Failed:", error));


// ✅ 3. Multer Setup - Store Files in Memory (For Direct Cloudinary Upload)
const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ 5MB max size
  fileFilter: (req, file, cb) => {
    console.log("DEBUG: File received in Multer:", file);
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// ✅ 4. Cloudinary Stream Upload Function
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blogs" }, 
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ✅ 5. GET all blogs
const getAllBlogs = async (req, res) => {
  try {
    console.log("DEBUG: Fetching all blogs...");
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

// ✅ 6. CREATE a new blog
const createBlog = async (req, res) => {
  try {
    console.log("DEBUG: Incoming File Object:", req.file);
    console.log("DEBUG: Incoming Form Data:", req.body);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    // ✅ Upload to Cloudinary via Stream
    const cloudinaryResponse = await streamUpload(req.file.buffer);

    console.log("DEBUG: Cloudinary Response:", JSON.stringify(cloudinaryResponse, null, 2));

    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      return res.status(500).json({ message: "Cloudinary upload failed!", response: cloudinaryResponse });
    }

    const imageUrl = cloudinaryResponse.secure_url;
    const imageId = cloudinaryResponse.public_id;

    const newBlog = new Blog({
      title: req.body.title, 
      description: req.body.description, 
      image: imageUrl, 
      imageId
    });

    await newBlog.save();

    res.status(201).json({ message: "Blog created successfully", newBlog });

  } catch (error) {
    console.error("❌ Error creating blog:", error);
    res.status(500).json({ message: "Error creating blog", error: error.message });
  }
};

// ✅ 7. UPDATE an existing blog
const updateBlog = async (req, res) => {
  try {
    console.log("DEBUG updateBlog -> req.body:", req.body);
    console.log("DEBUG updateBlog -> req.file:", req.file);

    const { title, description } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (req.file) {
      // ✅ If there's an existing image, delete it from Cloudinary
      if (blog.imageId) {
        await cloudinary.uploader.destroy(blog.imageId);
      }

      // ✅ Upload the new image
      const cloudinaryResponse = await streamUpload(req.file.buffer);

      if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
        return res.status(500).json({ message: "Cloudinary upload failed!", response: cloudinaryResponse });
      }

      blog.image = cloudinaryResponse.secure_url;
      blog.imageId = cloudinaryResponse.public_id;
    }

    blog.title = title;
    blog.description = description;

    const updatedBlog = await blog.save();
    res.json({ message: "Blog updated successfully", updatedBlog });

  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      message: "Error updating blog",
      error: error.message,
      stack: error.stack
    });
  }
};

// ✅ 8. DELETE a blog
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // ✅ Delete the image from Cloudinary if it exists
    if (blog.imageId) {
      await cloudinary.uploader.destroy(blog.imageId);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog and image deleted successfully" });

  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      message: "Error deleting blog",
      error: error.message,
      stack: error.stack
    });
  }
};

// ✅ 9. Export all functions
module.exports = {
  getAllBlogs,   // ✅ Function is now defined BEFORE export
  createBlog,
  updateBlog,
  deleteBlog,
  upload, 
};

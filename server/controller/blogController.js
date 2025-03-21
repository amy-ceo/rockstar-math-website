const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load .env file

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: "rockstarmath-image-base", // 🔹 Replace with your Firebase project ID
     private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzndWMD4mzGppi\ns/LDjt8DlWTneqpZUe8e4+BTpdT005OhAd3Y3cfDCc2leT1awtXj+gSxh9/E3OBz\neuRgGubU/z7qSUZQf8r0wkOUHDLvjMkUVcVYrf4XV1irc4rRcRTbelrVBQn2qZAJ\nzmi9w2Nlleb8l+L1o/InRfHpGkv30gItBncj6S5q8l7MZILxZS0DiFevuea1z/oJ\n1tpxbMjX3PCcBcD0stkZ8x0dVISdKk/nzm9ePiL/ln48kiCdmagB4G/CLgEnHqPQ\nvIi35oY+AySz5IBbYf8zP7gg+ab06NV1XU85Yr4oOBJE/CU8B1Z7AAKSw/gYJymv\niNORMWUnAgMBAAECggEADWUmcVkRTF2eCOFhp+rmP9aq3UZ9IMcm/ZdB+gsCfDWx\nK08/07YKeUWoZABMLpIcMHHLWtAGxKAyTvppwK8Q6u6UKxXG3CcDpEg+kPOfatUF\ng/I3kvr62ZPGhZbK0f7MbufLkVpcWVxg5RJTJl/FcGSDAvBy2R3eZ8ZkGZ2/753G\nSV90VOFWQhR1nswKnmHriYEzraoEYExSnW9QM79VCVfvKn+ubcWb/XudE6iIhK9Z\nVRZHMznxQLBf8MAPwdbm85tyEO7o4xMwwSfeS4J7s5g17cBvcxEduSMNmzc1vzw7\nKbZEefiv2tNhu+e78UDvCHuEwiPhp0290yrQhYhWZQKBgQDjIHJsoug4cEPfeEwQ\n7QlDAQnCg/t8eKiBSVo94SCR4LzCH025i+FKXw142jYnYaCnTotafv80McRwSpCa\na6cmnBfLwV06iJzqK0NWtRnGgRK3XU9IxEfjrG4U9yMkLB7BgGvSxgaPw8Jy/0/W\nPqiZQhYShY8uUXqimmQ1Gb2mMwKBgQDKczpA6F0qfjgIanPgYe5lE7bn/QMOD/eg\n4vShOOBM0vxuyQrX2inoB9Xsysyk+s4Jr4Rh662iy76xnySeDwdWPLlxGP1OmDee\nVsthPI8JOJVQPnGJbnqgPZRKFGYHq+dc5ZmcfmdEtHs/7aBfzcpqE2h4uZpO/bqw\nd2XYuDMJPQKBgFV/O1OFp2DHceVHRWsBr4DXfTMJt7tNODEiyaONgVMohCWW3w0/\niJkUWt/pVIVSjMUuHer871hYe5fBmdlnOM6h55s9uLh2AIttqbWUCpXctIztxRCh\nQmaD3BRsS4AsU4+Hpg77mDC6AhKD5SvC/nhilih2ukU3SrC26Y3LmMZdAoGAeB6Y\nUMzOAplzW6L18AuLLFPfMZSQjHZy4fXnWgVqKIsDFiSZF2utc6u6hU3q0HSzbVHD\nxWnV04L6OV+IlXOrUcKj8PP3z/tG/N7Yu2/4GmuFRGBYc0em4I7I/o9N3n1jwF3G\nn/DsCvrfKhYvEskCsZ+kXAUcBoRLkcq2Fjlspq0CgYEAxV0oMkoo10aGTTz6t7wv\nc5dhVjd2zrIRDTq/2FWp1PmAIXKQyPSJVrpuSlxFtsEp8575exGyKPuefJCmH55+\nAnZLALAGpBaA+9jtkd0cLuPPcPYPakI5Mf0TWLA3OC9VMP3NuwaciTbs3/B1LLh8\n5uJZIQJ6qfm3gGqTLwmu06w=\n-----END PRIVATE KEY-----\n",

      client_email: "firebase-adminsdk-fbsvc@rockstarmath-image-base.iam.gserviceaccount.com", // 🔹 Replace with your Firebase service account email
    }),
    storageBucket: "rockstarmath-image-base.firebasestorage.app", // 🔹 Replace with your Firebase Storage bucket name
  });
}

const bucket = admin.storage().bucket();



console.log("🔹 FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("🔹 FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);



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

const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Blog = require("../models/Blog");
const authenticateUser = require("../middleware/auth");
const optionalAuth = require('../middleware/optionalAuth')


// 1) image upload 
// Create the uploads directory if it doesn't exist.
const uploadDirectory = path.join(__dirname, "../public/uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

// Configure where uploaded images are stored.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        // Generate a unique filename rather than trusting the original name.
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }
});

// Accept only common image MIME types and extensions.
const allowedTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"]
};

// checks the declared MIME type and filename extension.
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const validExtensions = allowedTypes[file.mimetype] || [];

    if (validExtensions.includes(extension)) {
        return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
};

// Limit uploads to 5 MB and one image per request.
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});



// 2) routes
// Display the Add Blog page
router.get("/add-new", authenticateUser, (req, res) => {
    res.render("addBlogs", {
        user: req.user,
        error: req.query.error || null,
        success: req.query.success || null
    });
});

// Save a new blog
router.post("/", authenticateUser, (req, res, next) => {

    // accepts one uploaded file whose form field is named coverImage.
    upload.single("coverImage")(req, res, (err) => {
        if (err) {
            let message = "Unable to upload the cover image.";

            if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                return res.redirect(
                    "/blog/add-new?error=" +
                    encodeURIComponent("Image size must not exceed 5 MB.")
                );
            } 

            return res.redirect(
                "/blog/add-new?error=" +
                encodeURIComponent(message || "Image upload failed.")
            );
        }

        next();
    });
    },
    
    async (req, res) => {
    try {
        const { title, body } = req.body;

        // Validate required fields
        if (!title?.trim() || !body?.trim()) {
            // Delete the uploaded file if validation fails.
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.redirect(
                "/blog/add-new?error=Please%20enter%20both%20a%20blog%20titl%20and%20content."
            );
        }

        // Store a web-accessible path instead of the absolute disk path.
        const coverImage = req.file
            ? `/uploads/${req.file.filename}`
            : "/images/default-blog.jpg";

        // saves the image path and blog information to MongoDB.
        await Blog.create({
            title: title.trim(),
            body: body.trim(),
            coverImage,
            createdBy: req.user._id
        });

        // Redirect to the homepage after publishing
        return res.redirect("/?success=Blog%20Added%20Successfully");

    } catch (error) {

         // Remove an uploaded file if saving the blog fails.
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        console.error("Error creating blog:", error);

        return res.redirect(
            "/blog/add-new?error=Unable%20to%20publish%20your%20blog%20Please%20try%20again"
        );
    }
});


// Render Multer errors that reach Express's error handler.
router.use((err, req, res, next) => {
    if (err) {
        console.error("Blog route error:", err.message);

        return res.status(400).render("addBlogs", {
            user: req.user || null,
            error: "Something went wrong while uploading your image."
        });
    }

    next();
});



// 3) read-blog route
// Read a single blog
router.get("/read-blog/:id", optionalAuth, async (req, res) => {
    try {
        const blogId = req.params.id;

        // Find the blog using its ID
        const blog = await Blog.findById(blogId)
            .populate("createdBy", "fullname");

        // Check if blog exists
        if (!blog) {
            return res.status(404).send("Blog not found");
        }

        // Render the blog details page
        res.render("readBlog", {
            blog,
            user: req.user || null
        });

    } catch (error) {
        console.error("Error reading blog:", error.message);
        return res.status(500).send("Unable to load blog.");
    }
});

module.exports = router;
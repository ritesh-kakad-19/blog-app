const express = require('express');
const path = require('path');
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");


const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const blogRoutes = require('./routes/blogRoutes');
const authenticateUser = require("./middleware/auth");
const optionalAuth = require('./middleware/optionalAuth')
const Blog = require("./models/Blog");

// config the env file
dotenv.config();

// port and middleware
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))     // Parse form submissions from EJS
app.use(cookieParser());    // Read cookies from incoming HTTP requests
app.use(express.static(path.join(__dirname, "public")));    // Serve files from the public directory.


// view engine
app.set('view engine', 'ejs')
app.set('views', path.resolve('./views'))

// routes
app.get('/', optionalAuth, async (req, res)=>{

  try {
        // Fetch blogs and populate the author's name
        const blogs = await Blog.find()
            .populate("createdBy", "fullname")
            .sort({ createdAt: -1 });

        // Render homepage with blog data
        res.render("home", {
            user: req.user || null,
            blogs,
            success: req.query.success || null
        });

    } catch (error) {
        console.error("Error fetching blogs:", error.message);

        res.status(500).send("Unable to load blogs.");
    }
})

app.use("/", userRoutes);
app.use("/blog", blogRoutes);

// start the app
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  });
};

startServer();

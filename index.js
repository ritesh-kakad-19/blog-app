const express = require('express');
const path = require('path');
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");


const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authenticateUser = require("./middleware/auth");

// config the env file
dotenv.config();

// port and middleware
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))     // Parse form submissions from EJS
app.use(cookieParser());    // Read cookies from incoming HTTP requests


// view engine
app.set('view engine', 'ejs')
app.set('views', path.resolve('./views'))

// routes
app.get('/', authenticateUser, (req, res)=>{
    res.render('home', {
        success: req.query.success || null,
        user: req.user
    });
})

app.use("/", userRoutes);

// start the app
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  });
};

startServer();

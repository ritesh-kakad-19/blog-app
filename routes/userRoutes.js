const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../services/auth");

// Signup Route
router.get("/signup", async(req, res)=>{
    res.render('signup', {
        error: req.query.error || null
        
    });
})

router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.redirect(
            "/signup?error=User%20already%20exist"
        );
    }

    // Create user
    const user = await User.create({
      fullname,
      email,
      password,
    });

    // Redirect to the signin page after successful registration
    return res.redirect("/signin?success=Account created successfully!");

  } catch (error) {
     // Handle unexpected server errors
    console.error("Signin error:", error.message);

    return res.redirect(
        "/signup?error=Something%20went%20wrong"
    );
  }
});


// Sign In Route
router.get("/signin", async(req, res)=>{
    res.render('signin', {
        error: req.query.error || null,
        success: req.query.success || null
    });
})


router.post("/signin", async (req, res) => {
    try {
        // Get email and password submitted through the signin form
        const { email, password } = req.body;

        // Find the user in MongoDB using their email
        const user = await User.findOne({ email });

        // If the user does not exist, return an error
        if (!user) {
            return res.redirect(
                "/signin?error=Invalid%20email%20or%20password"
            );
        }

        // Compare the entered password with the hashed password in MongoDB
        // bcrypt.compare() returns true if the password matches, otherwise false
        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        // If the password does not match, reject the login
        if (!isPasswordMatch) {
            return res.redirect(
                "/signin?error=Invalid%20email%20or%20password"
            );
        }

        // Generate JWT after successful authentication
        const token = generateToken(user);

        // Store the token in an HTTP cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.redirect("/?success=Login successful!");

    } catch (error) {
        // Handle unexpected server errors
        console.error("Signin error:", error.message);

        return res.redirect(
            "/signin?error=Something%20went%20wrong"
        );
    }
    });


    // Logout route
    router.post("/logout", (req, res) => {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        return res.redirect("/");
    });



module.exports = router;
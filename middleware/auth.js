const { verifyToken } = require("../services/auth");
const User = require("../models/User");


// This middleware reads the token from the browser cookie, verifies it, and identifies the user.
const authenticateUser = async (req, res, next) => {
    try {
        // Read JWT from the browser cookie
        const token = req.cookies?.token;

        // Reject requests without a token
        if (!token) {
            return res.redirect("/signin");
        }

        // Verify the token's signature and expiration
        const decoded = verifyToken(token);

        // Find the user in MongoDB
        const user = await User.findById(decoded.id).select(
            "-password -salt"
        );

        // Reject the request if the user no longer exists
        if (!user) {
            res.clearCookie("token");
            return res.redirect("/signin");
        }

        // Attach the authenticated user to the request
        req.user = user;

        // Continue to the requested route
        next();

    } catch (error) {
        // Invalid, expired, or malformed token
        res.clearCookie("token");

        return res.redirect("/signin");
    }
};

module.exports = authenticateUser;
const jwt = require("jsonwebtoken");

// Generate a JWT token for an authenticated user
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            profileImageURL: user.profileImageURL,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};

// Verify a JWT token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken
};
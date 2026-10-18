const { verifyToken } = require("../services/auth");
const User = require("../models/User");

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    // Continue as a logged-out user if no token exists.
    if (!token) {
      res.locals.user = null;
      return next();
    }

    // Verify the token and find the logged-in user.
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password -salt");

    if (!user) {
      res.clearCookie("token", { path: "/" });
      res.locals.user = null;
      return next();
    }

    // Make the user available to EJS templates.
    req.user = user;
    res.locals.user = user;

    return next();
  } catch (error) {
    // Invalid or expired tokens should not block the home page.
    res.clearCookie("token", { path: "/" });
    res.locals.user = null;

    return next();
  }
};

module.exports = optionalAuth;
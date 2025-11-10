import auth from "./auth.middleware.js";

/**
 * Middleware to restrict routes to admin users only
 * Must be used after auth middleware
 */
const isAdmin = (req, res, next) => {
  // Ensure user is authenticated (auth middleware should set req.user)
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin privileges required." 
    });
  }

  next();
};

/**
 * Combined middleware: auth + isAdmin
 * Use this for admin-only routes
 */
export const requireAdmin = [auth, isAdmin];

export default isAdmin;



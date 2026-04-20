// middleware/roleMiddleware.js
// Factory function: returns a middleware that checks if the logged-in user has the required role
// Usage: requireRole('teacher') or requireRole('student')

function requireRole(role) {
  return function (req, res, next) {
    // req.user is set by authMiddleware
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${role}s can access this route.`
      });
    }
    next();
  };
}

module.exports = requireRole;

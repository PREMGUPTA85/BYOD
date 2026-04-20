// middleware/authMiddleware.js
// Checks if the incoming request has a valid JWT token
// If valid, attaches the decoded user info to req.user

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Get token from cookie (web browser) or Authorization header (API client)
  console.log("REQ COOKIES:", req.cookies);
  console.log("TOKEN:", req.cookies?.token);
const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
  }

  try {
    // Verify the token using the secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = authenticateToken;

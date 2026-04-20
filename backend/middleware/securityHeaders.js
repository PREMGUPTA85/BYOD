// middleware/securityHeaders.js
// Adds basic HTTP security headers to every response
// These prevent common web attacks like clickjacking and MIME sniffing

function securityHeaders(req, res, next) {
  // Prevent browsers from guessing content type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent this page from being embedded in an iframe (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');
  // Basic XSS protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Don't send the Referer header to external sites
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

module.exports = securityHeaders;

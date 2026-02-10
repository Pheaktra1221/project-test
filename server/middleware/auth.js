// server/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * verifyToken: Checks if the request has a valid JWT in the Authorization header.
 * Use this for any route that should NOT be public.
 */
export const verifyToken = (req, res, next) => {
  // Get token from header (Format: "Bearer <token>")
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`[Auth] Access denied to ${req.originalUrl} - No token provided`);
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Use same fallback secret as the controllers when JWT_SECRET is not set
    const secret = process.env.JWT_SECRET || 'dev-secret';
    // Verify the token using the secret
    const verified = jwt.verify(token, secret);
    req.user = verified; // Add user data (id, role) to the request object
    
    // Normalize role to lowercase to ensure consistent comparisons
    if (req.user.role) {
      req.user.role = req.user.role.toLowerCase();
    }
    
    next(); // Move to the next function (the Controller)
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

/**
 * checkRole: Optional middleware to restrict routes to specific roles (e.g., 'admin').
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};
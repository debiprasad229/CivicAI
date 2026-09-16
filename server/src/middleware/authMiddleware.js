import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verifies Bearer token and attaches req.user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'civicai_jwt_dev_secret_key_change_in_prod';
    const decoded = jwt.verify(token, secret);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user belonging to this token no longer exists'
      });
    }

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Token error:', error.message);
    const message = error.name === 'TokenExpiredError' 
      ? 'Not authorized, token has expired' 
      : 'Not authorized, invalid token';

    return res.status(401).json({
      success: false,
      message
    });
  }
};

// Grant access to specific roles (RBAC)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user context missing'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action`
      });
    }

    next();
  };
};

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to sign JWT token
// Helper to sign JWT token with production secret enforcement
const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing in production environment.');
  }
  return jwt.sign({ id, role }, secret || 'civicai_jwt_dev_secret_key_change_in_prod', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (Citizen or Admin)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role, ward, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Privilege escalation protection: in production, admin role requires authorization secret
    let assignedRole = 'citizen';
    if (role === 'admin') {
      if (process.env.NODE_ENV === 'production') {
        const adminSecret = req.body.adminSecret || req.headers['x-admin-secret'];
        if (process.env.ADMIN_REGISTRATION_SECRET && adminSecret === process.env.ADMIN_REGISTRATION_SECRET) {
          assignedRole = 'admin';
        } else {
          assignedRole = 'citizen';
        }
      } else {
        assignedRole = 'admin';
      }
    }

    // Create user (password automatically hashed in pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      ward: ward ? ward.trim() : 'Ward 14 (Central)',
      phone: phone ? phone.trim() : ''
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Authenticate user and return token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during authentication'
    });
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private (Bearer token)
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('[AuthController.getMe] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
};

import { Router } from 'express';
import { signup, login, getProfile, refreshToken } from '../controllers/authController';
import { validateSignup, validateLogin } from '../middleware/validation';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validateSignup, signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateJWT, getProfile);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticateJWT, refreshToken);

export default router;

import { Router } from 'express';
import { 
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/userController';
import { validateUserCreation, validateUserUpdate } from '../middleware/validation';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/', getUsers);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post('/', validateUserCreation, createUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user settings (enable/disable token creation, activate/deactivate)
 * @access  Admin only
 */
router.patch('/:id', validateUserUpdate, updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user
 * @access  Admin only
 */
router.delete('/:id', deleteUser);

export default router;

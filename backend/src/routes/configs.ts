import { Router } from 'express';
import { 
  getConfigs,
  getConfig,
  updateConfig,
  createConfig,
  deleteConfig
} from '../controllers/configController';
import { validateConfigUpdate } from '../middleware/validation';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/configs
 * @desc    Get all configuration settings
 * @access  Admin only
 */
router.get('/', getConfigs);

/**
 * @route   GET /api/v1/configs/key/:key
 * @desc    Get a specific configuration by key
 * @access  Admin only
 */
router.get('/key/:key', getConfig);

/**
 * @route   POST /api/v1/configs
 * @desc    Create a new configuration setting
 * @access  Admin only
 */
router.post('/', createConfig);

/**
 * @route   PATCH /api/v1/configs/:id
 * @desc    Update a configuration setting
 * @access  Admin only
 */
router.patch('/:id', validateConfigUpdate, updateConfig);

/**
 * @route   DELETE /api/v1/configs/:id
 * @desc    Delete a configuration setting
 * @access  Admin only
 */
router.delete('/:id', deleteConfig);

export default router;

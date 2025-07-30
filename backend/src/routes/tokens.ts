import { Router } from 'express';
import { 
  createToken,
  getTokens,
  updateToken,
  deleteToken
} from '../controllers/tokenController';
import { validateTokenCreation } from '../middleware/validation';
import { authenticateJWT, requireTokenCreationEnabled } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @route   GET /api/v1/tokens
 * @desc    Get all API tokens for the authenticated user
 * @access  Private (requires token creation enabled)
 */
router.get('/', requireTokenCreationEnabled, getTokens);

/**
 * @route   POST /api/v1/tokens
 * @desc    Create a new API token
 * @access  Private (requires token creation enabled)
 */
router.post('/', requireTokenCreationEnabled, validateTokenCreation, createToken);

/**
 * @route   PATCH /api/v1/tokens/:id
 * @desc    Update an API token (activate/deactivate, rename)
 * @access  Private (requires token creation enabled)
 */
router.patch('/:id', requireTokenCreationEnabled, updateToken);

/**
 * @route   DELETE /api/v1/tokens/:id
 * @desc    Delete an API token
 * @access  Private (requires token creation enabled)
 */
router.delete('/:id', requireTokenCreationEnabled, deleteToken);

export default router;

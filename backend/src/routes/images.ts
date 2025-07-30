import { Router } from 'express';
import { serveImage, getImageInfo } from '../controllers/imageController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @route   GET /api/v1/images/:screenshotId
 * @desc    Serve screenshot image (authenticated)
 * @access  Private
 * @query   type - 'full' or 'thumbnail'
 */
router.get('/:screenshotId', serveImage);

/**
 * @route   GET /api/v1/images/:screenshotId/info
 * @desc    Get image information and URLs
 * @access  Private
 */
router.get('/:screenshotId/info', getImageInfo);

export default router;

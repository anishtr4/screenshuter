import { Router } from 'express';
import { 
  downloadCollection,
  generateCollectionPDF
} from '../controllers/collectionController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @route   GET /api/v1/collections/:id/download
 * @desc    Download collection as ZIP file
 * @access  Private
 */
router.get('/:id/download', downloadCollection);

/**
 * @route   POST /api/v1/collections/:id/pdf
 * @desc    Generate PDF from collection screenshots
 * @access  Private
 */
router.post('/:id/pdf', generateCollectionPDF);

export default router;

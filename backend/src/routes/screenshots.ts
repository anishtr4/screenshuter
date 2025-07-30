import { Router } from 'express';
import { 
  createScreenshot,
  createCrawlScreenshot,
  selectCrawlUrls,
  getScreenshot,
  getCollectionScreenshots,
  deleteScreenshot,
  deleteCollection
} from '../controllers/screenshotController';
import { 
  validateScreenshot,
  validateCrawlScreenshot,
  validateCrawlSelection
} from '../middleware/validation';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @route   POST /api/v1/screenshots
 * @desc    Create a normal screenshot
 * @access  Private
 */
router.post('/', validateScreenshot, createScreenshot);

/**
 * @route   POST /api/v1/screenshots/crawl
 * @desc    Crawl URLs from a base URL
 * @access  Private
 */
router.post('/crawl', validateCrawlScreenshot, createCrawlScreenshot);

/**
 * @route   POST /api/v1/screenshots/crawl/select
 * @desc    Select URLs from crawl results and capture screenshots
 * @access  Private
 */
router.post('/crawl/select', validateCrawlSelection, selectCrawlUrls);

/**
 * @route   GET /api/v1/screenshots/:id
 * @desc    Get a specific screenshot
 * @access  Private
 */
router.get('/:id', getScreenshot);

/**
 * @route   GET /api/v1/screenshots/collection/:id
 * @desc    Get all screenshots in a collection
 * @access  Private
 */
router.get('/collection/:id', getCollectionScreenshots);

/**
 * @route   DELETE /api/v1/screenshots/collection/:id
 * @desc    Delete a collection and all its screenshots
 * @access  Private
 */
router.delete('/collection/:id', deleteCollection);

/**
 * @route   DELETE /api/v1/screenshots/:id
 * @desc    Delete a screenshot
 * @access  Private
 */
router.delete('/:id', deleteScreenshot);

export default router;

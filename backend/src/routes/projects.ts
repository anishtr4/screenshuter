import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject,
  generateProjectPDF
} from '../controllers/projectController';
import { validateProject } from '../middleware/validation';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', validateProject, createProject);

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects for the authenticated user
 * @access  Private
 */
router.get('/', getProjects);

/**
 * @route   POST /api/v1/projects/:id/pdf
 * @desc    Generate PDF from project screenshots
 * @access  Private
 */
router.post('/:id/pdf', generateProjectPDF);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get a specific project with screenshots and collections
 * @access  Private
 */
router.get('/:id', getProject);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update a project
 * @access  Private
 */
router.put('/:id', validateProject, updateProject);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete a project and all associated data
 * @access  Private
 */
router.delete('/:id', deleteProject);

export default router;

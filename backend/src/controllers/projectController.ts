import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Screenshot } from '../models/Screenshot';
import { Collection } from '../models/Collection';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { checkProjectLimits } from '../utils/checkLimits';
import { logger } from '../config/logger';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { name, description } = req.body;
  const userId = req.user.id;

  // Check project limits
  await checkProjectLimits(userId);

  // Check if project name already exists for this user
  const existingProject = await Project.findOne({ userId, name });
  if (existingProject) {
    throw createError('Project with this name already exists', 409);
  }

  const project = new Project({
    name,
    description,
    userId
  });

  await project.save();

  logger.info(`Project created: ${name}`, { projectId: project._id, userId });

  res.status(201).json({
    message: 'Project created successfully',
    project: {
      id: project._id,
      name: project.name,
      description: project.description,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
  });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const projects = await Project.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments({ userId });

  // Get screenshot counts for each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const screenshotCount = await Screenshot.countDocuments({ 
        projectId: project._id,
        status: 'completed'
      });
      
      const collectionCount = await Collection.countDocuments({ 
        projectId: project._id 
      });

      return {
        id: project._id,
        name: project.name,
        description: project.description,
        userId: project.userId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        screenshotCount,
        collectionCount
      };
    })
  );

  res.json({
    projects: projectsWithCounts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Get only individual screenshots (not collection screenshots)
  const individualScreenshots = await Screenshot.find({ 
    projectId: id,
    status: 'completed',
    type: 'normal' // Only individual screenshots
  })
    .sort({ createdAt: -1 })
    .select('_id url imagePath thumbnailPath metadata createdAt type');

  // Get collections for metadata
  const collections = await Collection.find({ projectId: id })
    .sort({ createdAt: -1 });

  // Get collection summary with frames
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      // Get all screenshots for this collection
      const collectionScreenshots = await Screenshot.find({ 
        collectionId: collection._id,
        status: 'completed'
      })
        .sort({ createdAt: -1 })
        .select('_id url imagePath thumbnailPath metadata createdAt type');

      const screenshotCount = collectionScreenshots.length;

      return {
        id: collection._id,
        projectId: collection.projectId,
        baseUrl: collection.baseUrl,
        name: collection.name,
        createdAt: collection.createdAt,
        screenshotCount,
        frames: collectionScreenshots.map(screenshot => ({
          _id: screenshot._id,
          url: screenshot.url,
          imagePath: screenshot.imagePath,
          thumbnailPath: screenshot.thumbnailPath,
          metadata: screenshot.metadata,
          createdAt: screenshot.createdAt,
          type: screenshot.type
        }))
      };
    })
  );

  // Transform individual screenshots
  const screenshotItems = individualScreenshots.map(screenshot => ({
    _id: screenshot._id,
    url: screenshot.url,
    imagePath: screenshot.imagePath,
    thumbnailPath: screenshot.thumbnailPath,
    metadata: screenshot.metadata,
    createdAt: screenshot.createdAt,
    type: screenshot.type,
    // Individual screenshot flags
    isIndividual: true,
    isCollection: false,
    collectionInfo: null
  }));

  // Add collections as items in the screenshots array
  const collectionItems = collectionsWithCounts.map(collection => ({
    _id: collection.id,
    url: collection.baseUrl,
    imagePath: null,
    thumbnailPath: null,
    metadata: {
      title: collection.name,
      screenshotCount: collection.screenshotCount
    },
    createdAt: collection.createdAt,
    type: 'collection' as const,
    // Collection flags
    isIndividual: false,
    isCollection: false,
    isCollectionFolder: true,
    collectionInfo: {
      id: collection.id,
      name: collection.name,
      baseUrl: collection.baseUrl,
      screenshotCount: collection.screenshotCount
    },
    frames: collection.frames // Include all screenshots in this collection
  }));

  // Combine screenshots and collections, sort by creation date
  const screenshots = [...screenshotItems, ...collectionItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );



  res.json({
    project: {
      id: project._id,
      name: project.name,
      userId: project.userId,
      createdAt: project.createdAt
    },
    screenshots
  });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Check if new name conflicts with existing projects
  if (name !== project.name) {
    const existingProject = await Project.findOne({ userId, name });
    if (existingProject) {
      throw createError('Project with this name already exists', 409);
    }
  }

  project.name = name;
  if (description !== undefined) {
    project.description = description;
  }
  await project.save();

  logger.info(`Project updated: ${name}`, { projectId: project._id, userId });

  res.json({
    message: 'Project updated successfully',
    project: {
      id: project._id,
      name: project.name,
      description: project.description,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
  });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Delete all associated screenshots and collections
  await Screenshot.deleteMany({ projectId: id });
  await Collection.deleteMany({ projectId: id });
  await Project.findByIdAndDelete(id);

  logger.info(`Project deleted: ${project.name}`, { projectId: id, userId });

  res.json({
    message: 'Project deleted successfully'
  });
});

export const generateProjectPDF = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;
  const config = req.body;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Get all screenshots and collections in this project
  const screenshots = await Screenshot.find({ projectId: id });
  const collections = await Collection.find({ projectId: id });
  
  if (!screenshots.length && !collections.length) {
    throw createError('No content found in project', 404);
  }

  // Create PDF
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({
    layout: config.layout || 'portrait',
    size: config.pageSize || 'A4',
    margin: config.margin || 20
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${config.title || project.name || 'project'}.pdf"`);

  doc.pipe(res);

  // Add title page
  doc.fontSize(24).text(config.title || project.name || 'Project', { align: 'center' });
  doc.moveDown();
  
  if (config.includeMetadata) {
    doc.fontSize(12);
    doc.text(`Screenshots: ${screenshots.length}`, { align: 'center' });
    doc.text(`Collections: ${collections.length}`, { align: 'center' });
    if (config.includeDates) {
      doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, { align: 'center' });
    }
  }

  doc.addPage();

  // Add screenshots
  const imagesPerPage = config.imagesPerPage || 2;
  const pageWidth = doc.page.width - (config.margin * 2);
  const pageHeight = doc.page.height - (config.margin * 2);
  
  let currentPage = 0;
  let imagesOnCurrentPage = 0;

  // Add individual screenshots first
  const individualScreenshots = screenshots.filter(s => !s.collectionId);
  
  for (let i = 0; i < individualScreenshots.length; i++) {
    const screenshot = individualScreenshots[i];
    
    if (imagesOnCurrentPage >= imagesPerPage) {
      doc.addPage();
      imagesOnCurrentPage = 0;
      currentPage++;
    }

    if (screenshot?.imagePath && require('fs').existsSync(screenshot.imagePath)) {
      try {
        const imageWidth = pageWidth / (imagesPerPage > 1 ? 2 : 1) - 10;
        const imageHeight = imageWidth * 0.6;
        
        const x = (imagesOnCurrentPage % 2) * (imageWidth + 10) + config.margin;
        const y = Math.floor(imagesOnCurrentPage / 2) * (imageHeight + 60) + config.margin;

        doc.image(screenshot.imagePath, x, y, {
          width: imageWidth,
          height: imageHeight,
          fit: [imageWidth, imageHeight]
        });

        // Add metadata below image
        if (config.includeMetadata) {
          doc.fontSize(8);
          const textY = y + imageHeight + 5;
          
          if (screenshot.metadata?.title) {
            doc.text(screenshot.metadata.title, x, textY, { width: imageWidth });
          }
          
          if (config.includeUrls && screenshot.url) {
            doc.text(screenshot.url, x, textY + 10, { width: imageWidth });
          }
          
          if (config.includeDates && screenshot.createdAt) {
            doc.text(new Date(screenshot.createdAt).toLocaleDateString(), x, textY + 20, { width: imageWidth });
          }
        }

        imagesOnCurrentPage++;
      } catch (error) {
        logger.error('Failed to add image to PDF', { error, screenshotId: screenshot?._id });
      }
    }
  }

  // Add collection screenshots
  for (const collection of collections) {
    const collectionScreenshots = screenshots.filter(s => s.collectionId?.toString() === collection._id.toString());
    
    if (collectionScreenshots.length > 0) {
      // Add collection header
      if (imagesOnCurrentPage > 0) {
        doc.addPage();
        imagesOnCurrentPage = 0;
      }
      
      doc.fontSize(16).text(`Collection: ${collection.name}`, { align: 'left' });
      doc.moveDown();
      
      for (const screenshot of collectionScreenshots) {
        if (imagesOnCurrentPage >= imagesPerPage) {
          doc.addPage();
          imagesOnCurrentPage = 0;
        }

        if (screenshot?.imagePath && require('fs').existsSync(screenshot.imagePath)) {
          try {
            const imageWidth = pageWidth / (imagesPerPage > 1 ? 2 : 1) - 10;
            const imageHeight = imageWidth * 0.6;
            
            const x = (imagesOnCurrentPage % 2) * (imageWidth + 10) + config.margin;
            const y = Math.floor(imagesOnCurrentPage / 2) * (imageHeight + 60) + config.margin;

            doc.image(screenshot.imagePath, x, y, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });

            // Add metadata below image
            if (config.includeMetadata) {
              doc.fontSize(8);
              const textY = y + imageHeight + 5;
              
              if (screenshot.metadata?.title) {
                doc.text(screenshot.metadata.title, x, textY, { width: imageWidth });
              }
              
              if (config.includeUrls && screenshot.url) {
                doc.text(screenshot.url, x, textY + 10, { width: imageWidth });
              }
              
              if (config.includeDates && screenshot.createdAt) {
                doc.text(new Date(screenshot.createdAt).toLocaleDateString(), x, textY + 20, { width: imageWidth });
              }
            }

            imagesOnCurrentPage++;
          } catch (error) {
            logger.error('Failed to add image to PDF', { error, screenshotId: screenshot?._id });
          }
        }
      }
    }
  }

  doc.end();

  logger.info(`Project PDF generated`, { projectId: id, userId, screenshotCount: screenshots.length, collectionCount: collections.length });
});

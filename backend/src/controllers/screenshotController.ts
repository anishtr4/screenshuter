import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Screenshot } from '../models/Screenshot';
import { Collection } from '../models/Collection';
import { Project } from '../models/Project';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { checkScreenshotLimits } from '../utils/checkLimits';
import { agenda } from '../config/agenda';
import { screenshotService } from '../services/ScreenshotService';
import { logger } from '../config/logger';

export const createScreenshot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { url, projectId, type = 'normal', timeFrames, autoScroll } = req.body;
  const userId = req.user.id;
  
  // Debug logging for autoScroll
  logger.info(`📝 Screenshot request received`, {
    url,
    projectId,
    timeFrames,
    autoScroll,
    hasAutoScroll: !!autoScroll,
    autoScrollEnabled: autoScroll?.enabled
  });

  // Validate project ID format
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError('Invalid project ID format', 400);
  }

  // Verify project ownership - super admins can access any project
  const query = req.user.role === 'super_admin' ? { _id: projectId } : { _id: projectId, userId };
  const project = await Project.findOne(query);
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Handle frame screenshots (multiple time-based captures)
  if (timeFrames && Array.isArray(timeFrames) && timeFrames.length > 0) {
    // Validate time frames (should be array of numbers in seconds)
    const validTimeFrames = timeFrames.filter(time => 
      typeof time === 'number' && time >= 0 && time <= 300 // Max 5 minutes
    );

    if (validTimeFrames.length === 0) {
      throw createError('At least one valid time frame is required (0-300 seconds)', 400);
    }

    // Check screenshot limits (multiply by number of frames)
    for (let i = 0; i < validTimeFrames.length; i++) {
      await checkScreenshotLimits(userId);
    }

    // Create collection for frame screenshots
    const collection = new Collection({
      projectId,
      baseUrl: url,
      name: `Frame Screenshots of ${new URL(url).hostname} - ${new Date().toLocaleDateString()}`,
      type: 'frame',
      metadata: {
        frameCount: validTimeFrames.length,
        timeFrames: validTimeFrames,
        autoScroll: autoScroll || null
      }
    });

    await collection.save();

    // Create screenshot records for each time frame
    const screenshots = [];
    for (let i = 0; i < validTimeFrames.length; i++) {
      const frameDelay = validTimeFrames[i];
      
      const screenshot = new Screenshot({
        projectId,
        url,
        imagePath: '', // Will be updated when captured
        type: 'frame',
        collectionId: collection._id,
        status: 'pending',
        metadata: {
          frameDelay,
          frameIndex: i + 1,
          totalFrames: validTimeFrames.length
        }
      });

      await screenshot.save();
      screenshots.push(screenshot);

      // Debug logging for job data
      const jobData = {
        screenshotId: screenshot._id.toString(),
        url,
        projectId,
        userId,
        frameDelay,
        frameIndex: i + 1,
        totalFrames: validTimeFrames.length,
        autoScroll: autoScroll || null,
        isScrollCapture: false
      };
      
      logger.info(`💼 Scheduling frame job`, {
        frameIndex: i + 1,
        autoScroll: jobData.autoScroll,
        autoScrollEnabled: jobData.autoScroll?.enabled
      });
      
      // Schedule frame screenshot capture job
      await agenda.now('capture-frame-screenshot', jobData);
    }

    // Emit initial collection progress
    const { io } = require('../index');
    io.to(`user-${userId}`).emit('collection-progress', {
      collectionId: collection._id.toString(),
      totalScreenshots: validTimeFrames.length,
      completedScreenshots: 0,
      progress: 0,
      stage: `Starting ${validTimeFrames.length} frame captures...`
    });

    logger.info(`Frame screenshot jobs scheduled for ${url}`, { 
      collectionId: collection._id,
      frameCount: validTimeFrames.length,
      timeFrames: validTimeFrames,
      projectId, 
      userId 
    });

    res.status(201).json({
      message: 'Frame screenshot captures scheduled',
      collection: {
        id: collection._id,
        projectId: collection.projectId,
        baseUrl: collection.baseUrl,
        name: collection.name,
        createdAt: collection.createdAt
      },
      screenshots: screenshots.map(s => ({
        id: s._id,
        url: s.url,
        frameDelay: s.metadata?.frameDelay,
        frameIndex: s.metadata?.frameIndex,
        status: s.status
      })),
      frameCount: validTimeFrames.length,
      timeFrames: validTimeFrames
    });
  } else {
    // Handle regular single screenshot
    // Check screenshot limits
    await checkScreenshotLimits(userId);

    // Create screenshot record
    const screenshot = new Screenshot({
      projectId,
      url,
      imagePath: '', // Will be updated when captured
      type,
      status: 'pending'
    });

    await screenshot.save();

    // Schedule screenshot capture job
    await agenda.now('capture-screenshot', {
      screenshotId: screenshot._id.toString(),
      url,
      projectId,
      userId,
      type
    });

    logger.info(`Screenshot job scheduled for ${url}`, { 
      screenshotId: screenshot._id, 
      projectId, 
      userId 
    });

    res.status(201).json({
      message: 'Screenshot capture scheduled',
      screenshot: {
        id: screenshot._id,
        projectId: screenshot.projectId,
        url: screenshot.url,
        type: screenshot.type,
        status: screenshot.status,
        createdAt: screenshot.createdAt
      }
    });
  }
});



export const createCrawlScreenshot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { baseUrl, projectId } = req.body;
  const userId = req.user.id;

  // Validate project ID format
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError('Invalid project ID format', 400);
  }

  // Verify project ownership - super admins can access any project
  const query = req.user.role === 'super_admin' ? { _id: projectId } : { _id: projectId, userId };
  const project = await Project.findOne(query);
  if (!project) {
    throw createError('Project not found', 404);
  }

  try {
    // Crawl URLs
    const urls = await screenshotService.crawlUrls(baseUrl);
    
    if (urls.length === 0) {
      throw createError('No URLs found to crawl', 400);
    }

    // Create collection
    const collection = new Collection({
      projectId,
      baseUrl,
      name: `Crawl of ${new URL(baseUrl).hostname} - ${new Date().toLocaleDateString()}`,
      type: 'crawl',
      metadata: {
        totalUrls: urls.length
      }
    });

    await collection.save();

    logger.info(`Crawl completed for ${baseUrl}`, { 
      collectionId: collection._id,
      urlCount: urls.length,
      projectId,
      userId 
    });

    res.json({
      message: 'URLs crawled successfully',
      collection: {
        id: collection._id,
        projectId: collection.projectId,
        baseUrl: collection.baseUrl,
        name: collection.name,
        createdAt: collection.createdAt
      },
      urls,
      urlCount: urls.length
    });

  } catch (error) {
    logger.error(`Crawl failed for ${baseUrl}:`, error);
    throw createError('Failed to crawl URLs', 500);
  }
});

export const selectCrawlUrls = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { collectionId, selectedUrls } = req.body;
  const userId = req.user.id;

  // Verify collection exists and user owns the project
  logger.info('Starting collection lookup', { collectionId, userId });
  
  const collection = await Collection.findById(collectionId).populate('projectId');
  if (!collection) {
    logger.error('Collection not found', { collectionId });
    throw createError('Collection not found', 404);
  }

  logger.info('Collection found', { 
    collectionId: collection._id,
    projectId: collection.projectId,
    hasProject: !!collection.projectId 
  });

  const project = collection.projectId as any;
  
  if (!project) {
    logger.error('Project not found in collection', { collectionId });
    throw createError('Project not found', 404);
  }
  
  // Debug logging
  logger.info('Access check debug', {
    collectionId,
    projectUserId: project.userId?.toString(),
    currentUserId: userId,
    userRole: req.user.role,
    projectUserIdType: typeof project.userId,
    currentUserIdType: typeof userId
  });
  
  // Allow super admins to access any project's collections
  if (req.user.role !== 'super_admin' && project.userId.toString() !== userId.toString()) {
    throw createError('Access denied', 403);
  }

  // Check screenshot limits (multiply by number of selected URLs)
  for (let i = 0; i < selectedUrls.length; i++) {
    await checkScreenshotLimits(userId);
  }

  // Schedule crawl screenshot capture job
  await agenda.now('capture-crawl-screenshots', {
    collectionId: collection._id.toString(),
    urls: selectedUrls,
    projectId: project._id.toString(),
    userId
  });

  logger.info(`Crawl screenshot job scheduled`, { 
    collectionId: collection._id,
    urlCount: selectedUrls.length,
    projectId: project._id,
    userId 
  });

  res.json({
    message: 'Crawl screenshot capture scheduled',
    collection: {
      id: collection._id,
      projectId: collection.projectId,
      baseUrl: collection.baseUrl,
      name: collection.name,
      createdAt: collection.createdAt
    },
    selectedUrlCount: selectedUrls.length
  });
});

export const getScreenshot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const screenshot = await Screenshot.findById(id).populate('projectId');
  if (!screenshot) {
    throw createError('Screenshot not found', 404);
  }

  // Verify ownership
  const project = screenshot.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  res.json({
    screenshot: {
      id: screenshot._id,
      projectId: screenshot.projectId,
      url: screenshot.url,
      imagePath: screenshot.imagePath,
      thumbnailPath: screenshot.thumbnailPath,
      type: screenshot.type,
      collectionId: screenshot.collectionId,
      status: screenshot.status,
      errorMessage: screenshot.errorMessage,
      metadata: screenshot.metadata,
      createdAt: screenshot.createdAt
    }
  });
});

export const getCollectionScreenshots = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Verify collection exists and user owns the project
  const collection = await Collection.findById(id).populate('projectId');
  if (!collection) {
    throw createError('Collection not found', 404);
  }

  const project = collection.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  // Get screenshots in this collection
  const screenshots = await Screenshot.find({ collectionId: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('_id url imagePath thumbnailPath status errorMessage metadata createdAt');

  const total = await Screenshot.countDocuments({ collectionId: id });

  res.json({
    collection: {
      id: collection._id,
      projectId: collection.projectId,
      baseUrl: collection.baseUrl,
      name: collection.name,
      createdAt: collection.createdAt
    },
    screenshots,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const deleteScreenshot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const screenshot = await Screenshot.findById(id).populate('projectId');
  if (!screenshot) {
    throw createError('Screenshot not found', 404);
  }

  // Verify ownership
  const project = screenshot.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  // Delete the screenshot record
  await Screenshot.findByIdAndDelete(id);

  logger.info(`Screenshot deleted`, { screenshotId: id, userId });

  res.json({
    message: 'Screenshot deleted successfully'
  });
});

export const getProjectScreenshots = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id: projectId } = req.params;
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Validate project ID format
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError('Invalid project ID format', 400);
  }

  // Verify project ownership - super admins can access any project
  const query = req.user.role === 'super_admin' ? { _id: projectId } : { _id: projectId, userId };
  const project = await Project.findOne(query);
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Get individual screenshots (not part of collections)
  const screenshots = await Screenshot.find({ 
    projectId, 
    collectionId: { $exists: false } // Only individual screenshots
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('_id url imagePath thumbnailPath type status errorMessage metadata createdAt');

  const total = await Screenshot.countDocuments({ 
    projectId, 
    collectionId: { $exists: false }
  });

  res.json({
    screenshots,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getProjectCollections = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id: projectId } = req.params;
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Validate project ID format
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError('Invalid project ID format', 400);
  }

  // Verify project ownership - super admins can access any project
  const query = req.user.role === 'super_admin' ? { _id: projectId } : { _id: projectId, userId };
  const project = await Project.findOne(query);
  if (!project) {
    throw createError('Project not found', 404);
  }

  // Get all collections for this project
  const collections = await Collection.find({ projectId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('_id baseUrl name type metadata createdAt');

  // Get screenshot counts for each collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      const screenshotCount = await Screenshot.countDocuments({ 
        collectionId: collection._id 
      });
      return {
        ...collection.toObject(),
        screenshotCount
      };
    })
  );

  const total = await Collection.countDocuments({ projectId });

  res.json({
    collections: collectionsWithCounts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const collection = await Collection.findById(id).populate('projectId');
  if (!collection) {
    throw createError('Collection not found', 404);
  }

  // Verify ownership
  const project = collection.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  // Delete all screenshots in this collection
  await Screenshot.deleteMany({ collectionId: id });

  // Delete the collection record
  await Collection.findByIdAndDelete(id);

  logger.info(`Collection deleted`, { collectionId: id, userId });

  res.json({
    message: 'Collection deleted successfully'
  });
});

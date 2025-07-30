import { Request, Response } from 'express';
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

  const { url, projectId, type = 'normal', timeFrames } = req.body;
  const userId = req.user.id;

  // Verify project ownership
  const project = await Project.findOne({ _id: projectId, userId });
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
        timeFrames: validTimeFrames
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

      // Schedule frame screenshot capture job
      await agenda.now('capture-frame-screenshot', {
        screenshotId: screenshot._id.toString(),
        url,
        projectId,
        userId,
        frameDelay,
        frameIndex: i + 1,
        totalFrames: validTimeFrames.length
      });
    }

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

  // Verify project ownership
  const project = await Project.findOne({ _id: projectId, userId });
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
  const collection = await Collection.findById(collectionId).populate('projectId');
  if (!collection) {
    throw createError('Collection not found', 404);
  }

  const project = collection.projectId as any;
  if (project.userId.toString() !== userId) {
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

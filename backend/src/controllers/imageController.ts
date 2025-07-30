import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { Screenshot } from '../models/Screenshot';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export const serveImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { screenshotId } = req.params;
  const { type = 'full' } = req.query; // 'full' or 'thumbnail'
  const userId = req.user.id;

  // Find the screenshot and verify ownership
  const screenshot = await Screenshot.findById(screenshotId).populate('projectId');
  if (!screenshot) {
    throw createError('Screenshot not found', 404);
  }

  // Verify ownership
  const project = screenshot.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  // Determine which image to serve
  const imagePath = type === 'thumbnail' && screenshot.thumbnailPath 
    ? screenshot.thumbnailPath 
    : screenshot.imagePath;

  if (!imagePath) {
    throw createError('Image not available', 404);
  }

  // Construct full file path
  const fullPath = path.join(__dirname, '../../', imagePath);
  
  // Log for debugging
  logger.info('Serving image', {
    screenshotId,
    type,
    imagePath,
    fullPath,
    userId
  });

  try {
    // Check if file exists
    await fs.access(fullPath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Stream the file
    res.sendFile(fullPath);

  } catch (error) {
    throw createError('Image file not found', 404);
  }
});

export const getImageInfo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { screenshotId } = req.params;
  const userId = req.user.id;

  // Find the screenshot and verify ownership
  const screenshot = await Screenshot.findById(screenshotId).populate('projectId');
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
      url: screenshot.url,
      imagePath: screenshot.imagePath,
      thumbnailPath: screenshot.thumbnailPath,
      status: screenshot.status,
      metadata: screenshot.metadata,
      createdAt: screenshot.createdAt
    },
    imageUrls: {
      full: `/api/v1/images/${screenshotId}?type=full`,
      thumbnail: screenshot.thumbnailPath ? `/api/v1/images/${screenshotId}?type=thumbnail` : null
    }
  });
});

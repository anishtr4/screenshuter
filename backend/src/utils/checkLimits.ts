import { Screenshot } from '../models/Screenshot';
import { Project } from '../models/Project';
import { Config } from '../models/Config';
import { createError } from '../middleware/errorHandler';

export const checkScreenshotLimits = async (userId: string): Promise<void> => {
  try {
    // Get free tier limit from config
    const limitConfig = await Config.findOne({ key: 'free_tier_screenshots_per_month' });
    const monthlyLimit = limitConfig?.value as number || 100000;

    // Calculate current month's screenshot count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count screenshots created this month across all user's projects
    const userProjects = await Project.find({ userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const screenshotCount = await Screenshot.countDocuments({
      projectId: { $in: projectIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['completed', 'processing', 'pending'] }
    });

    if (screenshotCount >= monthlyLimit) {
      throw createError(`Monthly screenshot limit of ${monthlyLimit} reached`, 429);
    }

  } catch (error) {
    if (error instanceof Error && (error as any).statusCode) {
      throw error;
    }
    throw createError('Failed to check screenshot limits', 500);
  }
};

export const checkProjectLimits = async (userId: string): Promise<void> => {
  try {
    // Get free tier limit from config
    const limitConfig = await Config.findOne({ key: 'free_tier_max_projects' });
    const projectLimit = limitConfig?.value as number || 10;

    // Count user's projects
    const projectCount = await Project.countDocuments({ userId });

    if (projectCount >= projectLimit) {
      throw createError(`Project limit of ${projectLimit} reached`, 429);
    }

  } catch (error) {
    if (error instanceof Error && (error as any).statusCode) {
      throw error;
    }
    throw createError('Failed to check project limits', 500);
  }
};

export const getRemainingLimits = async (userId: string) => {
  try {
    // Get limits from config
    const screenshotLimitConfig = await Config.findOne({ key: 'free_tier_screenshots_per_month' });
    const projectLimitConfig = await Config.findOne({ key: 'free_tier_max_projects' });
    
    const monthlyScreenshotLimit = screenshotLimitConfig?.value as number || 100000;
    const projectLimit = projectLimitConfig?.value as number || 10;

    // Calculate current month's screenshot count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count screenshots and projects
    const userProjects = await Project.find({ userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const screenshotCount = await Screenshot.countDocuments({
      projectId: { $in: projectIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['completed', 'processing', 'pending'] }
    });

    const projectCount = userProjects.length;

    return {
      screenshots: {
        used: screenshotCount,
        limit: monthlyScreenshotLimit,
        remaining: Math.max(0, monthlyScreenshotLimit - screenshotCount)
      },
      projects: {
        used: projectCount,
        limit: projectLimit,
        remaining: Math.max(0, projectLimit - projectCount)
      }
    };

  } catch (error) {
    throw createError('Failed to get remaining limits', 500);
  }
};

import Agenda from 'agenda';
import { logger } from './logger';
import { ScreenshotService } from '../services/ScreenshotService';

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/screenshot-saas';

export const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  processEvery: '10 seconds',
  maxConcurrency: 5,
});

// Job definitions
agenda.define('capture-screenshot', async (job: any) => {
  const { 
    screenshotId, 
    url, 
    projectId, 
    userId, 
    type = 'normal',
    cookiePrevention,
    deviceScaleFactor,
    customCSS,
    customJS,
    basicAuth,
    customCookies
  } = job.attrs.data;
  
  // Extract trigger selectors for interactive screenshots
  const { triggerSelectors } = job.attrs.data;
  
  logger.info(`Starting screenshot capture job for ${url}`, { screenshotId, projectId, userId });
  
  try {
    const screenshotService = new ScreenshotService();
    await screenshotService.captureScreenshot({
      screenshotId,
      url,
      projectId,
      userId,
      type,
      cookiePrevention,
      deviceScaleFactor,
      customCSS,
      customJS,
      basicAuth,
      customCookies,
      triggerSelectors
    });
    
    logger.info(`Screenshot capture completed for ${url}`, { screenshotId });
  } catch (error) {
    logger.error(`Screenshot capture failed for ${url}:`, error);
    throw error;
  }
});

agenda.define('capture-frame-screenshot', async (job: any) => {
  const { 
    collectionId, 
    url, 
    projectId, 
    userId, 
    frameDelay, 
    frameIndex, 
    totalFrames, 
    autoScroll, 
    isScrollCapture,
    cookiePrevention,
    deviceScaleFactor,
    customCSS,
    customJS,
    basicAuth,
    customCookies
  } = job.attrs.data;
  
  logger.info(`Starting frame screenshot capture job for ${url} at ${frameDelay}s`, { 
    collectionId, projectId, userId, frameDelay, frameIndex, totalFrames 
  });
  
  try {
    const screenshotService = new ScreenshotService();
    await screenshotService.captureFrameScreenshot({
      collectionId,
      url,
      projectId,
      userId,
      frameDelay,
      frameIndex,
      totalFrames,
      autoScroll,
      isScrollCapture,
      cookiePrevention,
      deviceScaleFactor,
      customCSS,
      customJS,
      basicAuth,
      customCookies
    });
    
    logger.info(`Frame screenshot capture completed for ${url} at ${frameDelay}s`, { collectionId, frameIndex });
  } catch (error) {
    logger.error(`Frame screenshot capture failed for ${url} at ${frameDelay}s:`, error);
    throw error;
  }
});

agenda.define('capture-crawl-screenshots', async (job: any) => {
  const { 
    collectionId, 
    urls, 
    projectId, 
    userId,
    cookiePrevention,
    deviceScaleFactor,
    customCSS,
    customJS,
    basicAuth,
    customCookies
  } = job.attrs.data;
  
  logger.info(`Starting crawl screenshot capture job`, { collectionId, urlCount: urls.length });
  
  try {
    const screenshotService = new ScreenshotService();
    await screenshotService.captureCrawlScreenshots({
      collectionId,
      urls,
      projectId,
      userId,
      cookiePrevention,
      deviceScaleFactor,
      customCSS,
      customJS,
      basicAuth,
      customCookies
    });
    
    logger.info(`Crawl screenshot capture completed`, { collectionId });
  } catch (error) {
    logger.error(`Crawl screenshot capture failed:`, error);
    throw error;
  }
});

// Event handlers
agenda.on('ready', () => {
  logger.info('Agenda job queue is ready');
});

agenda.on('start', (job) => {
  logger.info(`Job ${job.attrs.name} starting`, { jobId: job.attrs._id });
});

agenda.on('complete', (job) => {
  logger.info(`Job ${job.attrs.name} completed`, { jobId: job.attrs._id });
});

agenda.on('fail', (err, job) => {
  logger.error(`Job ${job.attrs.name} failed:`, err, { jobId: job.attrs._id });
});

export const initializeAgenda = async (): Promise<void> => {
  try {
    await agenda.start();
    logger.info('Agenda job queue started successfully');
  } catch (error) {
    logger.error('Failed to start Agenda job queue:', error);
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down Agenda job queue...');
  await agenda.stop();
  logger.info('Agenda job queue stopped');
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

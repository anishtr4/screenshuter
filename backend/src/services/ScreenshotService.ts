import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { Screenshot } from '../models/Screenshot';
import { Collection } from '../models/Collection';
import { logger } from '../config/logger';
import { io } from '../index';

export interface ScreenshotJobData {
  screenshotId: string;
  url: string;
  projectId: string;
  userId: string;
  type: 'normal' | 'crawl';
}

export interface CrawlJobData {
  collectionId: string;
  urls: string[];
  projectId: string;
  userId: string;
}

export class ScreenshotService {
  private browser: Browser | null = null;
  private readonly uploadDir: string;
  private readonly screenshotsDir: string;
  private readonly collectionsDir: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
    this.collectionsDir = path.join(__dirname, '../../uploads/collections');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      await fs.mkdir(this.collectionsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directories:', error);
    }
  }

  private async ensureScreenshotDirectory(screenshotId: string, collectionId?: string): Promise<string> {
    const screenshotDir = collectionId 
      ? path.join(this.collectionsDir, collectionId, screenshotId)
      : path.join(this.screenshotsDir, screenshotId);
    
    await fs.mkdir(screenshotDir, { recursive: true });
    return screenshotDir;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      });
    }
    return this.browser;
  }

  async captureScreenshot(data: ScreenshotJobData): Promise<void> {
    const { screenshotId, url, userId, type } = data;
    
    try {
      // Update status to processing
      await Screenshot.findByIdAndUpdate(screenshotId, { 
        status: 'processing' 
      });

      // Emit initial progress
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 0,
        stage: 'Initializing browser...'
      });

      // Emit progress: browser ready
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 10,
        stage: 'Browser ready, creating page...'
      });

      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Emit progress: configuring page
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 20,
        stage: 'Configuring page settings...'
      });

      // Set viewport and user agent
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      // Emit progress: navigating to URL
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 30,
        stage: `Navigating to ${url}...`
      });

      // Navigate to URL with increased timeout for heavy websites
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: parseInt(process.env.SCREENSHOT_TIMEOUT || '60000') // Increased to 60 seconds
        });
      } catch (error) {
        // If networkidle fails, try with domcontentloaded as fallback
        if (error instanceof Error && error.message.includes('Timeout')) {
          logger.warn(`Networkidle timeout for ${url}, trying domcontentloaded...`);
          
          io.to(`user-${userId}`).emit('screenshot-progress', {
            screenshotId,
            status: 'processing',
            progress: 35,
            stage: 'Retrying with faster loading strategy...'
          });
          
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: parseInt(process.env.SCREENSHOT_TIMEOUT || '60000')
          });
          
          // Wait a bit more for content to load
          await page.waitForTimeout(5000);
        } else {
          throw error;
        }
      }

      // Emit progress: page loaded
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 60,
        stage: 'Page loaded, waiting for content...'
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Get page title
      const title = await page.title();

      // Get screenshot record to check if it belongs to a collection
      const screenshot = await Screenshot.findById(screenshotId);
      const collectionId = screenshot?.collectionId?.toString();

      // Create organized directory structure
      const screenshotDir = await this.ensureScreenshotDirectory(screenshotId, collectionId);
      
      const imagePath = path.join(screenshotDir, 'full.png');
      const thumbnailPath = path.join(screenshotDir, 'thumbnail.png');

      // Emit progress: taking screenshot
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 70,
        stage: 'Capturing screenshot...'
      });

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        path: imagePath,
        fullPage: true,
        type: 'png'
      });

      await page.close();

      // Emit progress: generating thumbnail
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 85,
        stage: 'Generating thumbnail...'
      });

      // Generate thumbnail
      await sharp(screenshotBuffer)
        .resize(300, 200, { fit: 'cover' })
        .png()
        .toFile(thumbnailPath);

      // Get file stats
      const stats = await fs.stat(imagePath);
      const imageInfo = await sharp(imagePath).metadata();

      // Update screenshot record with new path structure
      const relativePath = collectionId 
        ? `uploads/collections/${collectionId}/${screenshotId}`
        : `uploads/screenshots/${screenshotId}`;

      await Screenshot.findByIdAndUpdate(screenshotId, {
        status: 'completed',
        imagePath: `${relativePath}/full.png`,
        thumbnailPath: `${relativePath}/thumbnail.png`,
        metadata: {
          title,
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: stats.size,
          capturedAt: new Date()
        }
      });

      // Emit completion progress
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'completed',
        progress: 100,
        stage: 'Screenshot completed!',
        imagePath: `${relativePath}/full.png`,
        thumbnailPath: `${relativePath}/thumbnail.png`,
        metadata: {
          title,
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: stats.size
        }
      });

      logger.info(`Screenshot captured successfully for ${url}`, { screenshotId });

    } catch (error) {
      logger.error(`Screenshot capture failed for ${url}:`, error);

      // Update status to failed
      await Screenshot.findByIdAndUpdate(screenshotId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      // Emit failure progress
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'failed',
        progress: 0,
        stage: 'Screenshot failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  async captureCrawlScreenshots(data: CrawlJobData): Promise<void> {
    const { collectionId, urls, projectId, userId } = data;

    try {
      logger.info(`Starting crawl screenshot capture for ${urls.length} URLs`, { collectionId });

      // Create screenshot records for all URLs
      const screenshotPromises = urls.map(async (url) => {
        const screenshot = new Screenshot({
          projectId,
          url,
          imagePath: '', // Will be updated when captured
          type: 'crawl',
          collectionId,
          status: 'pending'
        });
        return screenshot.save();
      });

      const screenshots = await Promise.all(screenshotPromises);

      // Emit initial crawl progress
      io.to(`user-${userId}`).emit('collection-progress', {
        collectionId,
        totalScreenshots: screenshots.length,
        completedScreenshots: 0,
        progress: 0,
        stage: 'Starting crawl capture...'
      });

      // Capture screenshots sequentially to avoid overwhelming the browser
      let completedCount = 0;
      for (const screenshot of screenshots) {
        try {
          await this.captureScreenshot({
            screenshotId: screenshot._id.toString(),
            url: screenshot.url,
            projectId,
            userId,
            type: 'crawl'
          });
          
          completedCount++;
          const progress = Math.round((completedCount / screenshots.length) * 100);
          
          // Emit crawl progress update
          io.to(`user-${userId}`).emit('collection-progress', {
            collectionId,
            totalScreenshots: screenshots.length,
            completedScreenshots: completedCount,
            progress,
            stage: `Captured ${completedCount}/${screenshots.length} screenshots`
          });
          
        } catch (error) {
          logger.error(`Failed to capture screenshot for ${screenshot.url}:`, error);
          // Continue with other screenshots even if one fails
        }
      }

      logger.info(`Crawl screenshot capture completed for collection ${collectionId}`);

    } catch (error) {
      logger.error(`Crawl screenshot capture failed for collection ${collectionId}:`, error);
      throw error;
    }
  }

  async crawlUrls(baseUrl: string, maxDepth: number = 2): Promise<string[]> {
    const visitedUrls = new Set<string>();
    const urlsToCrawl = [baseUrl];
    const foundUrls = new Set<string>([baseUrl]);
    
    try {
      const browser = await this.getBrowser();
      const maxPages = parseInt(process.env.CRAWL_MAX_PAGES || '50');

      while (urlsToCrawl.length > 0 && foundUrls.size < maxPages) {
        const currentUrl = urlsToCrawl.shift()!;
        
        if (visitedUrls.has(currentUrl)) continue;
        visitedUrls.add(currentUrl);

        try {
          const page = await browser.newPage();
          await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          });

          await page.goto(currentUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: parseInt(process.env.CRAWL_TIMEOUT || '30000') // Increased timeout for crawling
          });

          // Extract links from the page
          const links = await page.$$eval('a[href]', (anchors) => {
            return anchors
              .map(anchor => (anchor as any).href)
              .filter(href => href && !href.startsWith('mailto:') && !href.startsWith('tel:'));
          });

          await page.close();

          // Filter and add new URLs
          const baseUrlObj = new URL(baseUrl);
          for (const link of links) {
            try {
              const linkUrl = new URL(link);
              
              // Only include URLs from the same domain
              if (linkUrl.hostname === baseUrlObj.hostname && 
                  !foundUrls.has(link) && 
                  foundUrls.size < maxPages) {
                foundUrls.add(link);
                
                // Add to crawl queue if we haven't reached max depth
                if (visitedUrls.size < maxDepth * 10) {
                  urlsToCrawl.push(link);
                }
              }
            } catch (error) {
              // Invalid URL, skip
            }
          }

        } catch (error) {
          logger.warn(`Failed to crawl ${currentUrl}:`, error);
          // Continue with other URLs
        }
      }

      return Array.from(foundUrls);

    } catch (error) {
      logger.error(`Crawling failed for ${baseUrl}:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
export const screenshotService = new ScreenshotService();

// Cleanup on process exit
process.on('exit', () => {
  screenshotService.cleanup();
});

process.on('SIGINT', () => {
  screenshotService.cleanup();
});

process.on('SIGTERM', () => {
  screenshotService.cleanup();
});

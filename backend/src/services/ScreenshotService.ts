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

export interface FrameScreenshotJobData {
  screenshotId: string;
  url: string;
  projectId: string;
  userId: string;
  frameDelay: number;
  frameIndex: number;
  totalFrames: number;
  autoScroll?: {
    enabled: boolean;
    selector: string;
    stepSize: number;
    interval: number;
  };
  isScrollCapture?: boolean;
  scrollPosition?: number;
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

  async captureFrameScreenshot(data: FrameScreenshotJobData): Promise<void> {
    // Debug logging for received job data
    logger.info(`📬 Frame job received`, {
      screenshotId: data.screenshotId,
      frameIndex: data.frameIndex,
      autoScroll: data.autoScroll,
      autoScrollEnabled: data.autoScroll?.enabled,
      isScrollCapture: data.isScrollCapture
    });
    
    const { screenshotId, url, userId, frameDelay, frameIndex, totalFrames, autoScroll, isScrollCapture, projectId } = data;
    
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
        stage: `Capturing frame ${frameIndex}/${totalFrames} at ${frameDelay}s...`
      });

      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      // Emit progress: navigating to URL
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 20,
        stage: `Loading ${url}...`
      });

      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: parseInt(process.env.SCREENSHOT_TIMEOUT || '30000')
      });

      // Wait for the specified frame delay
      if (frameDelay > 0) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 40,
          stage: `Waiting ${frameDelay}s for frame timing...`
        });
        
        await page.waitForTimeout(frameDelay * 1000);
      }

      // Emit progress: taking screenshot
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 60,
        stage: 'Taking screenshot...'
      });

      // Get the screenshot document to find collectionId
      const screenshot = await Screenshot.findById(screenshotId);
      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // Create directory for this screenshot
      const screenshotDir = await this.ensureScreenshotDirectory(screenshotId, screenshot.collectionId?.toString());
      
      // Take the screenshot
      const screenshotPath = path.join(screenshotDir, 'screenshot.png');
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        type: 'png'
      });

      // Emit progress: processing image
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 80,
        stage: 'Processing image...'
      });

      // Create thumbnail
      const thumbnailPath = path.join(screenshotDir, 'thumbnail.jpg');
      await sharp(screenshotPath)
        .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Update screenshot with paths (include uploads/ prefix for image controller)
      const relativePath = screenshot.collectionId 
        ? path.join('uploads', 'collections', screenshot.collectionId.toString(), screenshotId, 'screenshot.png')
        : path.join('uploads', 'screenshots', screenshotId, 'screenshot.png');
      
      const relativeThumbnailPath = screenshot.collectionId 
        ? path.join('uploads', 'collections', screenshot.collectionId.toString(), screenshotId, 'thumbnail.jpg')
        : path.join('uploads', 'screenshots', screenshotId, 'thumbnail.jpg');

      await Screenshot.findByIdAndUpdate(screenshotId, {
        imagePath: relativePath,
        thumbnailPath: relativeThumbnailPath,
        status: 'completed'
      });

      await page.close();

      // Emit completion
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'completed',
        progress: 100,
        stage: `Frame ${frameIndex}/${totalFrames} completed!`
      });

      // Update collection progress
      if (screenshot.collectionId) {
        // Count completed screenshots in this collection (only time-based frames, not scroll captures)
        const completedTimeFrames = await Screenshot.countDocuments({
          collectionId: screenshot.collectionId,
          status: 'completed',
          'metadata.frameIndex': { $exists: true } // Only count time-based frames
        });
        
        const progress = Math.round((completedTimeFrames / totalFrames) * 100);
        
        // Emit collection progress update
        io.to(`user-${userId}`).emit('collection-progress', {
          collectionId: screenshot.collectionId.toString(),
          totalScreenshots: totalFrames,
          completedScreenshots: completedTimeFrames,
          progress,
          stage: `Captured ${completedTimeFrames}/${totalFrames} frames`
        });
        
        // Debug logging for auto-scroll trigger
        logger.info(`🔍 Auto-scroll trigger check`, {
          completedTimeFrames,
          totalFrames,
          autoScroll: autoScroll,
          autoScrollEnabled: autoScroll?.enabled,
          isScrollCapture,
          shouldTrigger: completedTimeFrames === totalFrames && autoScroll?.enabled === true && !isScrollCapture
        });
        
        // Check if this is the last time frame and auto-scroll is enabled
        if (completedTimeFrames === totalFrames && autoScroll?.enabled === true && !isScrollCapture) {
          logger.info(`🔄 Triggering auto-scroll capture`, { 
            collectionId: screenshot.collectionId.toString(), 
            autoScroll, 
            completedTimeFrames, 
            totalFrames 
          });
          
          // Emit scroll starting progress
          io.to(`user-${userId}`).emit('collection-progress', {
            collectionId: screenshot.collectionId.toString(),
            totalScreenshots: totalFrames,
            completedScreenshots: totalFrames,
            progress: 100,
            stage: 'Starting auto-scroll capture...',
            isScrolling: true
          });
          
          await this.startAutoScrollCapture({
            url,
            projectId,
            userId,
            collectionId: screenshot.collectionId.toString(),
            autoScroll,
            totalFrames
          });
        }
      }

      logger.info(`Frame screenshot captured successfully for ${url} at ${frameDelay}s`, { screenshotId, frameIndex, totalFrames });

    } catch (error) {
      logger.error(`Frame screenshot capture failed for ${url}:`, error);
      
      // Update screenshot status to failed
      await Screenshot.findByIdAndUpdate(screenshotId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      // Emit failure
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'failed',
        progress: 0,
        stage: `Frame ${frameIndex} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      throw error;
    }
  }

  async startAutoScrollCapture(data: {
    url: string;
    projectId: string;
    userId: string;
    collectionId: string;
    totalFrames: number;
    autoScroll: {
      enabled: boolean;
      selector: string;
      stepSize: number;
      interval: number;
    };
  }): Promise<void> {
    const { url, projectId, userId, collectionId, totalFrames, autoScroll } = data;
    
    try {
      logger.info(`🔄 Starting auto-scroll capture for ${url}`, {
        collectionId,
        selector: autoScroll.selector,
        stepSize: autoScroll.stepSize,
        interval: autoScroll.interval
      });
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      // Navigate to the page
      const timeout = parseInt(process.env.SCREENSHOT_TIMEOUT || '30000');
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout 
      });
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      let screenshotCount = 0;
      let scrollPosition = 0;
      const maxScrollAttempts = 50; // Prevent infinite scrolling
      
      // Enhanced scroll detection function with tinyscrollbar support
      const getScrollInfo = async () => {
        return await page.evaluate(`
          (function(selector) {
            const element = document.querySelector(selector);
            if (!element) {
              return { canScroll: false, scrollType: 'none', error: 'Element not found' };
            }
            
            // Check for tinyscrollbar structure (#viewport and #overview)
            const viewport = element.querySelector('#viewport');
            const overview = element.querySelector('#overview');
            
            if (viewport && overview) {
              // Tinyscrollbar detected - use CSS top position for scroll detection
              const scrollTop = Math.abs(parseFloat(overview.style.top) || 0);
              const viewportHeight = viewport.clientHeight;
              const overviewHeight = overview.scrollHeight;
              const maxScroll = Math.max(0, overviewHeight - viewportHeight);
              
              return {
                canScroll: scrollTop < maxScroll,
                scrollTop: scrollTop,
                scrollHeight: overviewHeight,
                clientHeight: viewportHeight,
                maxScroll: maxScroll,
                scrollType: 'tinyscrollbar',
                elementInfo: {
                  selector: selector,
                  viewportHeight: viewportHeight,
                  overviewHeight: overviewHeight,
                  currentTop: overview.style.top
                }
              };
            }
            
            // Fallback: Check for generic tinyscrollbar classes
            const genericViewport = element.querySelector('.viewport');
            const genericOverview = element.querySelector('.overview');
            
            if (genericViewport && genericOverview) {
              const scrollTop = Math.abs(parseFloat(genericOverview.style.top) || 0);
              const viewportHeight = genericViewport.clientHeight;
              const overviewHeight = genericOverview.scrollHeight;
              const maxScroll = Math.max(0, overviewHeight - viewportHeight);
              
              return {
                canScroll: scrollTop < maxScroll,
                scrollTop: scrollTop,
                scrollHeight: overviewHeight,
                clientHeight: viewportHeight,
                maxScroll: maxScroll,
                scrollType: 'tinyscrollbar-generic',
                elementInfo: {
                  selector: selector,
                  viewportHeight: viewportHeight,
                  overviewHeight: overviewHeight,
                  currentTop: genericOverview.style.top
                }
              };
            }
            
            // Page-wide fallback: Search for any tinyscrollbar elements
            const allViewports = document.querySelectorAll('.viewport, [data-scrollbar] .viewport');
            for (const vp of allViewports) {
              const vpElement = vp;
              const ovElement = vpElement.querySelector('.overview');
              if (ovElement && ovElement.scrollHeight > vpElement.clientHeight) {
                const scrollTop = Math.abs(parseFloat(ovElement.style.top) || 0);
                const maxScroll = Math.max(0, ovElement.scrollHeight - vpElement.clientHeight);
                
                return {
                  canScroll: scrollTop < maxScroll,
                  scrollTop: scrollTop,
                  scrollHeight: ovElement.scrollHeight,
                  clientHeight: vpElement.clientHeight,
                  maxScroll: maxScroll,
                  scrollType: 'tinyscrollbar-found',
                  elementInfo: {
                    selector: 'auto-detected',
                    viewportHeight: vpElement.clientHeight,
                    overviewHeight: ovElement.scrollHeight,
                    currentTop: ovElement.style.top
                  }
                };
              }
            }
            
            // Standard scrolling fallback
            const canScroll = element.scrollHeight > element.clientHeight;
            return {
              canScroll: canScroll,
              scrollTop: element.scrollTop,
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
              maxScroll: element.scrollHeight - element.clientHeight,
              scrollType: 'standard',
              elementInfo: {
                selector: selector,
                scrollHeight: element.scrollHeight,
                clientHeight: element.clientHeight,
                scrollTop: element.scrollTop
              }
            };
          })('${autoScroll.selector}')
        `);
      };
      
      // Initial scroll check
      let scrollInfo: any = await getScrollInfo();
      logger.info(`📊 Initial scroll detection:`, scrollInfo);
      
      if (!scrollInfo.canScroll) {
        logger.warn(`⚠️ Element is not scrollable, skipping auto-scroll`, {
          selector: autoScroll.selector,
          scrollInfo
        });
        await page.close();
        return;
      }
      
      // Auto-scroll loop
      while (scrollInfo.canScroll && screenshotCount < maxScrollAttempts) {
        logger.info(`📸 Taking scroll screenshot ${screenshotCount + 1}`, {
          scrollPosition,
          scrollInfo: {
            scrollTop: scrollInfo.scrollTop,
            scrollType: scrollInfo.scrollType
          }
        });
        
        // Create screenshot record
        const screenshot = new Screenshot({
          projectId,
          url,
          imagePath: '', // Will be updated when captured
          type: 'scroll',
          collectionId,
          status: 'pending',
          metadata: {
            scrollPosition,
            scrollIndex: screenshotCount + 1,
            isAutoScroll: true,
            scrollType: scrollInfo.scrollType
          }
        });
        
        await screenshot.save();
        
        // Take screenshot at current position
        const screenshotDir = await this.ensureScreenshotDirectory(screenshot._id.toString(), collectionId);
        const screenshotPath = path.join(screenshotDir, 'screenshot.png');
        
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: false, // Don't use fullPage for scroll captures
          type: 'png'
        });
        
        // Create thumbnail
        const thumbnailPath = path.join(screenshotDir, 'thumbnail.jpg');
        await sharp(screenshotPath)
          .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        // Update screenshot with paths
        const relativePath = path.join('uploads', 'collections', collectionId, screenshot._id.toString(), 'screenshot.png');
        const relativeThumbnailPath = path.join('uploads', 'collections', collectionId, screenshot._id.toString(), 'thumbnail.jpg');
        
        await Screenshot.findByIdAndUpdate(screenshot._id, {
          imagePath: relativePath,
          thumbnailPath: relativeThumbnailPath,
          status: 'completed'
        });
        
        screenshotCount++;
        
        // Scroll to next position with tinyscrollbar support
        await page.evaluate(`
          (function(selector, stepSize) {
            const element = document.querySelector(selector);
            if (!element) return;
            
            // Check for tinyscrollbar (#viewport and #overview)
            const viewport = element.querySelector('#viewport');
            const overview = element.querySelector('#overview');
            
            if (viewport && overview) {
              // Tinyscrollbar scrolling - modify CSS top position
              const currentTop = parseFloat(overview.style.top) || 0;
              const newTop = currentTop - stepSize;
              overview.style.top = newTop + 'px';
              
              // Trigger tinyscrollbar update if available
              const scrollbar = element.tinyscrollbar;
              if (scrollbar && scrollbar.update) {
                scrollbar.update();
              }
              return;
            }
            
            // Fallback: Generic tinyscrollbar classes
            const genericViewport = element.querySelector('.viewport');
            const genericOverview = element.querySelector('.overview');
            
            if (genericViewport && genericOverview) {
              const currentTop = parseFloat(genericOverview.style.top) || 0;
              const newTop = currentTop - stepSize;
              genericOverview.style.top = newTop + 'px';
              
              const scrollbar = element.tinyscrollbar;
              if (scrollbar && scrollbar.update) {
                scrollbar.update();
              }
              return;
            }
            
            // Standard scrolling fallback
            element.scrollTop += stepSize;
          })('${autoScroll.selector}', ${autoScroll.stepSize})
        `);
        
        scrollPosition += autoScroll.stepSize;
        
        // Wait for the specified interval
        await page.waitForTimeout(autoScroll.interval);
        
        // Check if we can still scroll
        scrollInfo = await getScrollInfo();
        
        // Emit progress update
        io.to(`user-${userId}`).emit('collection-progress', {
          collectionId,
          totalScreenshots: totalFrames + screenshotCount,
          completedScreenshots: totalFrames + screenshotCount,
          progress: Math.round(((totalFrames + screenshotCount) / (totalFrames + screenshotCount + 1)) * 100),
          stage: `Auto-scroll: captured ${screenshotCount} additional screenshots`,
          isScrolling: true
        });
      }
      
      await page.close();
      
      // Final progress update
      io.to(`user-${userId}`).emit('collection-progress', {
        collectionId,
        totalScreenshots: totalFrames + screenshotCount,
        completedScreenshots: totalFrames + screenshotCount,
        progress: 100,
        stage: `Completed: ${totalFrames} frames + ${screenshotCount} scroll captures`,
        isScrolling: false
      });
      
      logger.info(`✅ Auto-scroll capture completed`, { 
        collectionId, 
        totalScrollScreenshots: screenshotCount,
        finalScrollPosition: scrollPosition
      });
      
    } catch (error) {
      logger.error(`❌ Auto-scroll capture failed for ${url}:`, error);
      
      // Emit error
      io.to(`user-${userId}`).emit('collection-progress', {
        collectionId,
        totalScreenshots: totalFrames,
        completedScreenshots: totalFrames,
        progress: 100,
        stage: `Auto-scroll failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isScrolling: false
      });
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

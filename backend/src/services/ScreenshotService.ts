import { chromium, Browser, Page } from 'playwright';
import { addExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { Screenshot, IScreenshot } from '../models/Screenshot';
import { Collection } from '../models/Collection';
import { logger } from '../config/logger';
import { io } from '../index';

// Add stealth plugin to playwright
const chromiumStealth = addExtra(chromium);
chromiumStealth.use(StealthPlugin());

export interface ScreenshotJobData {
  screenshotId: string;
  url: string;
  projectId: string;
  userId: string;
  type: 'normal' | 'crawl';
  collectionId?: string;
  collectionName?: string;
  // Screenshot options
  cookiePrevention?: boolean;
  deviceScaleFactor?: number;
  width?: number;
  height?: number;
  fullPage?: boolean;
  unsticky?: boolean; // Whether to make sticky elements static (true) or keep them sticky (false)
  customCSS?: string;
  customJS?: string;
  injectBeforeNavigation?: boolean; // When to inject CSS/JS: true = before navigation, false = after navigation
  injectBeforeViewport?: boolean; // When to inject JS: true = before viewport is set, false = after viewport is set
  // Authentication options
  basicAuth?: {
    username: string;
    password: string;
  };
  // Cookie injection
  customCookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  // Trigger selectors for interactive screenshots
  triggerSelectors?: Array<{
    selector: string;
    delay: number; // milliseconds to wait before clicking
    waitAfter: number; // milliseconds to wait after clicking before screenshot
    description?: string; // optional description for the action
  }>;
  // Form automation for multi-step form filling and validation
  formSteps?: Array<{
    stepName: string;
    formInputs: Array<{
      selector: string;
      value: string;
      inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea';
      description?: string;
    }>;
    submitTrigger?: {
      selector: string;
      waitAfter: number;
      description?: string;
    };
    validationChecks?: Array<{
      selector: string;
      expectedText?: string;
      checkType: 'exists' | 'text' | 'class' | 'attribute';
      description?: string;
    }>;
    stepTimeout: number;
    takeScreenshotAfterFill: boolean;
    takeScreenshotAfterSubmit: boolean;
    takeScreenshotAfterValidation: boolean;
  }>;
}

export interface CrawlJobData {
  collectionId: string;
  urls: string[];
  projectId: string;
  userId: string;
  // Screenshot options
  cookiePrevention?: boolean;
  deviceScaleFactor?: number;
  width?: number;
  height?: number;
  fullPage?: boolean;
  unsticky?: boolean; // Whether to make sticky elements static (true) or keep them sticky (false)
  customCSS?: string;
  customJS?: string;
  injectBeforeNavigation?: boolean; // When to inject CSS/JS: true = before navigation, false = after navigation
  injectBeforeViewport?: boolean; // When to inject JS: true = before viewport is set, false = after viewport is set
  // Authentication options
  basicAuth?: {
    username: string;
    password: string;
  };
  // Cookie injection
  customCookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  // Form automation for multi-step form filling and validation
  formSteps?: Array<{
    stepName: string;
    formInputs: Array<{
      selector: string;
      value: string;
      inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea';
      description?: string;
    }>;
    submitTrigger?: {
      selector: string;
      waitAfter: number;
      description?: string;
    };
    validationChecks?: Array<{
      selector: string;
      expectedText?: string;
      checkType: 'exists' | 'text' | 'class' | 'attribute';
      description?: string;
    }>;
    stepTimeout: number;
    takeScreenshotAfterFill: boolean;
    takeScreenshotAfterSubmit: boolean;
    takeScreenshotAfterValidation: boolean;
  }>;
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
  // Screenshot options
  cookiePrevention?: boolean;
  deviceScaleFactor?: number;
  customCSS?: string;
  customJS?: string;
  // Authentication options
  basicAuth?: {
    username: string;
    password: string;
  };
  // Cookie injection
  customCookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
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
      const stealthEnabled = process.env.STEALTH_MODE_ENABLED === 'true';
      
      // Use stealth-enabled chromium for better bot detection evasion
      const browserEngine = stealthEnabled ? chromiumStealth : chromium;
      logger.info(`🤖 Launching browser with stealth mode: ${stealthEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      this.browser = await browserEngine.launch({
        headless: true,
        args: [
          // Basic security and performance
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
          '--max_old_space_size=4096',
          
          // Anti-bot detection measures
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-sync',
          '--metrics-recording-only',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--enable-features=NetworkService,NetworkServiceLogging',
          '--force-color-profile=srgb',
          '--disable-features=VizDisplayCompositor',
          
          // Realistic browser behavior
          '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
          '--accept-lang=en-US,en;q=0.9',
          '--window-size=1920,1080',
          '--start-maximized'
        ]
      });
      
      logger.info('🤖 Browser launched with stealth mode enabled');
    }
    return this.browser;
  }

  private async configurePageForScreenshot(page: Page, options?: {
    cookiePrevention?: boolean;
    deviceScaleFactor?: number;
    width?: number;
    height?: number;
    fullPage?: boolean;
    unsticky?: boolean;
    customCSS?: string;
    customJS?: string;
    injectBeforeNavigation?: boolean;
    injectBeforeViewport?: boolean;
    basicAuth?: {
      username: string;
      password: string;
    };
    customCookies?: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }>;
    triggerSelectors?: Array<{
      selector: string;
      delay: number;
      waitAfter: number;
      description?: string;
    }>;
  }): Promise<void> {
    // Get options with defaults
    const {
      cookiePrevention = process.env.COOKIE_PREVENTION_ENABLED === 'true' || true,
      deviceScaleFactor = parseFloat(process.env.DEVICE_SCALE_FACTOR || '2'),
      width = 1920,
      height = 1080,
      fullPage = true,
      customCSS = '',
      customJS = '',
      injectBeforeNavigation = false, // Default to inject after navigation
      injectBeforeViewport = false, // Default to inject JS after viewport is set
      basicAuth,
      customCookies
    } = options || {};
    
    // Inject JS before viewport if timing is set to before viewport
    if (injectBeforeNavigation && injectBeforeViewport && customJS && customJS.trim()) {
      await page.addScriptTag({
        content: customJS
      });
      logger.info('Custom JavaScript injected before viewport is set');
    }
    
    // Set viewport size using user-provided or default dimensions
    await page.setViewportSize({ 
      width, 
      height 
    });
    
    // Inject JS after viewport if timing is set to after viewport (default)
    if (injectBeforeNavigation && !injectBeforeViewport && customJS && customJS.trim()) {
      await page.addScriptTag({
        content: customJS
      });
      logger.info('Custom JavaScript injected after viewport is set');
    }
    
    // Set media emulation for consistent screenshots
    await page.emulateMedia({ 
      media: 'screen',
      reducedMotion: 'reduce' // Reduce animations for consistent screenshots
    });
    
    // Note: Device scale factor should be set when creating the browser context
    // For now, we'll log the intended scale factor
    if (deviceScaleFactor !== 2) {
      logger.info(`Device scale factor ${deviceScaleFactor} requested (applied at context level)`);
    }
    
    // Set realistic headers to avoid bot detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });

    // Advanced anti-bot detection measures
    await page.addInitScript(`
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {
              type: 'application/x-google-chrome-pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: null
            },
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
            name: 'Chrome PDF Plugin'
          },
          {
            0: {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: '',
              enabledPlugin: null
            },
            description: '',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            length: 1,
            name: 'Chrome PDF Viewer'
          }
        ],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Mock chrome runtime
      if (!window.chrome) {
        window.chrome = {};
      }
      if (!window.chrome.runtime) {
        window.chrome.runtime = {
          onConnect: undefined,
          onMessage: undefined,
        };
      }

      // Mock screen properties
      Object.defineProperty(screen, 'availTop', { get: () => 0 });
      Object.defineProperty(screen, 'availLeft', { get: () => 0 });
      Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
      Object.defineProperty(screen, 'availHeight', { get: () => 1080 });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
      Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });

      // Mock connection
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 100,
          downlink: 2.0,
          saveData: false
        }),
      });

      // Override toString methods to hide automation
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function() {
        if (this === navigator.webdriver) {
          return 'function webdriver() { [native code] }';
        }
        return originalToString.call(this);
      };

      // Add realistic timing
      const originalPerformanceNow = performance.now;
      let performanceOffset = Math.random() * 1000;
      performance.now = function() {
        return originalPerformanceNow.call(this) + performanceOffset;
      };

      // Mock battery API
      if (!navigator.getBattery) {
        navigator.getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: Math.random() * 0.5 + 0.5
        });
      }
    `);

    // Set up HTTP Basic Authentication if provided
    if (basicAuth) {
      await page.setExtraHTTPHeaders({
        'Authorization': `Basic ${Buffer.from(`${basicAuth.username}:${basicAuth.password}`).toString('base64')}`
      });
    }

    // Inject custom cookies if provided
    logger.info(`🍪 Cookie injection debug:`, {
      customCookiesType: typeof customCookies,
      customCookiesLength: customCookies?.length,
      customCookiesArray: Array.isArray(customCookies),
      firstCookie: customCookies?.[0]
    });
    
    if (customCookies && customCookies.length > 0) {
      try {
        // Convert custom cookies to Playwright format
        const playwrightCookies = customCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || new URL(page.url() || 'http://localhost').hostname,
          path: cookie.path || '/',
          ...(cookie.expires !== undefined && { expires: cookie.expires }),
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || false,
          sameSite: cookie.sameSite || 'Lax' as 'Strict' | 'Lax' | 'None'
        }));
        
        await page.context().addCookies(playwrightCookies);
        logger.info(`Injected ${customCookies.length} custom cookies`);
      } catch (error) {
        logger.warn('Failed to inject custom cookies:', error);
      }
    }

    // Check if cookie prevention is enabled
    const cookiePreventionEnabled = cookiePrevention;
    
    if (cookiePreventionEnabled) {
      // Block cookies and related storage
      await page.context().addInitScript(`
        // Override document.cookie
        Object.defineProperty(document, 'cookie', {
          get: () => '',
          set: () => {},
          configurable: false
        });
        
        // Override localStorage
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            key: () => null,
            length: 0
          },
          configurable: false
        });
        
        // Override sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
          value: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            key: () => null,
            length: 0
          },
          configurable: false
        });
        
        // Override indexedDB
        Object.defineProperty(window, 'indexedDB', {
          value: null,
          configurable: false
        });
      `);

      // Block cookie-related requests and common cookie consent scripts
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        const resourceType = route.request().resourceType();
        
        // Block known cookie consent services and tracking scripts
        const blockedDomains = [
          'cookiebot.com',
          'cookiepro.com',
          'onetrust.com',
          'trustarc.com',
          'cookielaw.org',
          'cookieinformation.com',
          'quantcast.com',
          'google-analytics.com',
          'googletagmanager.com',
          'facebook.com/tr',
          'connect.facebook.net',
          'hotjar.com',
          'fullstory.com',
          'mixpanel.com',
          'segment.com',
          'intercom.io'
        ];
        
        // Check if URL contains blocked domains
        const shouldBlock = blockedDomains.some(domain => url.includes(domain));
        
        if (shouldBlock) {
          logger.debug(`Blocked cookie/tracking request: ${url}`);
          await route.abort();
          return;
        }
        
        // Block specific cookie consent script patterns
        if (resourceType === 'script') {
          const cookieScriptPatterns = [
            /cookie[_-]?consent/i,
            /cookie[_-]?banner/i,
            /cookie[_-]?notice/i,
            /gdpr[_-]?consent/i,
            /privacy[_-]?consent/i,
            /consent[_-]?manager/i,
            /cookielaw/i,
            /onetrust/i
          ];
          
          if (cookieScriptPatterns.some(pattern => pattern.test(url))) {
            logger.debug(`Blocked cookie consent script: ${url}`);
            await route.abort();
            return;
          }
        }
        
        // Continue with the request if not blocked
        await route.continue();
      });

      // Inject CSS to hide common cookie consent elements
      await page.addStyleTag({
        content: `
          /* Hide common cookie consent selectors */
          [id*="cookie"],
          [class*="cookie"],
          [id*="consent"],
          [class*="consent"],
          [id*="gdpr"],
          [class*="gdpr"],
          [id*="privacy"],
          [class*="privacy"],
          .cookie-banner,
          .cookie-notice,
          .cookie-consent,
          .consent-banner,
          .gdpr-banner,
          .privacy-banner,
          #cookieNotice,
          #cookieBanner,
          #cookieConsent,
          #gdprConsent,
          #privacyConsent,
          .CookieConsent,
          .cookielaw-banner,
          .onetrust-banner-sdk,
          .ot-sdk-container,
          .trustarc-banner,
          .truste-banner,
          .cookiebot-banner,
          .cookiepro-banner,
          [data-testid*="cookie"],
          [data-testid*="consent"],
          [aria-label*="cookie" i],
          [aria-label*="consent" i],
          [role="dialog"][aria-describedby*="cookie"],
          [role="dialog"][aria-describedby*="consent"],
          .cc-banner,
          .cc-window,
          .cookie-alert,
          .consent-modal,
          .privacy-modal {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            z-index: -1 !important;
          }
          
          /* Remove overlay backgrounds that might block content */
          .cookie-overlay,
          .consent-overlay,
          .gdpr-overlay,
          .privacy-overlay {
            display: none !important;
          }
          
          /* Ensure body is not blocked by cookie consent */
          body {
            overflow: auto !important;
            position: static !important;
          }
        `
      });

      logger.info('Cookie prevention configured for page');
    }

    // Inject custom CSS if provided and timing is set to before navigation
    if (injectBeforeNavigation && customCSS && customCSS.trim()) {
      await page.addStyleTag({
        content: customCSS
      });
      logger.info('Custom CSS injected before navigation');
    }
    
    // Note: JS injection before navigation is now handled above based on viewport timing
    // This ensures proper timing control for JS injection relative to viewport setting
  }

  /**
   * Inject CSS/JS after page navigation
   */
  private async injectCustomCSSJS(page: Page, customCSS?: string, customJS?: string): Promise<void> {
    // Inject custom CSS if provided
    if (customCSS && customCSS.trim()) {
      await page.addStyleTag({
        content: customCSS
      });
      logger.info('Custom CSS injected after navigation');
    }

    // Inject custom JavaScript if provided
    if (customJS && customJS.trim()) {
      await page.addScriptTag({
        content: customJS
      });
      logger.info('Custom JavaScript injected after navigation');
    }
  }

  /**
   * Make sticky elements unsticky (static) for clean full page screenshot
   */
  private async makeStickyElementsStatic(page: Page): Promise<void> {
    try {
      // Scroll to top first
      await page.evaluate(`window.scrollTo(0, 0)`);
      await page.waitForTimeout(300);
      
      // Convert sticky/fixed elements to static positioning
      await page.evaluate(`
        // Store original styles to restore later if needed
        window.modifiedStickyElements = [];
        
        // Find all sticky/fixed elements
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          const position = computedStyle.position;
          
          if (position === 'sticky' || position === 'fixed') {
            // Store original values
            window.modifiedStickyElements.push({
              element: element,
              originalPosition: position,
              originalTop: computedStyle.top,
              originalZIndex: computedStyle.zIndex
            });
            
            // Convert to static positioning
            element.style.setProperty('position', 'static', 'important');
            element.style.setProperty('top', 'auto', 'important');
            element.style.setProperty('bottom', 'auto', 'important');
            element.style.setProperty('left', 'auto', 'important');
            element.style.setProperty('right', 'auto', 'important');
            element.style.setProperty('z-index', 'auto', 'important');
          }
        });
        
        console.log('Made', window.modifiedStickyElements.length, 'sticky/fixed elements static');
      `);
      
      // Wait for layout to recalculate
      await page.waitForTimeout(500);
      
      logger.info('✅ Sticky elements converted to static positioning for clean full page screenshot');
    } catch (error) {
      logger.warn('⚠️ Error making sticky elements static:', error);
    }
  }

  /**
   * Execute multi-step form automation with screenshots
   */
  private async executeFormAutomation(
    page: Page, 
    formSteps: Array<{
      stepName: string;
      formInputs: Array<{
        selector: string;
        value: string;
        inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea';
        description?: string;
      }>;
      submitTrigger?: {
        selector: string;
        waitAfter: number;
        description?: string;
      };
      validationChecks?: Array<{
        selector: string;
        expectedText?: string;
        checkType: 'exists' | 'text' | 'class' | 'attribute';
        description?: string;
      }>;
      stepTimeout: number;
      takeScreenshotAfterFill: boolean;
      takeScreenshotAfterSubmit: boolean;
      takeScreenshotAfterValidation: boolean;
    }>,
    screenshotDir: string,
    userId: string,
    screenshotId: string
  ): Promise<string[]> {
    const screenshotPaths: string[] = [];
    
    try {
      logger.info(`🔄 Starting form automation with ${formSteps.length} steps`);
      
      for (let stepIndex = 0; stepIndex < formSteps.length; stepIndex++) {
        const step = formSteps[stepIndex];
        if (!step) continue;
        
        logger.info(`📝 Executing step ${stepIndex + 1}: ${step.stepName}`);
        
        // Emit progress
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 30 + (stepIndex / formSteps.length) * 40,
          stage: `Form Step ${stepIndex + 1}: ${step.stepName}`,
        });
        
        // Fill form inputs
        if (step.formInputs && step.formInputs.length > 0) {
          logger.info(`📋 Filling ${step.formInputs.length} form inputs`);
          
          for (const input of step.formInputs) {
            try {
              await page.waitForSelector(input.selector, { timeout: step.stepTimeout });
              
              switch (input.inputType) {
                case 'text':
                case 'textarea':
                  await page.fill(input.selector, input.value);
                  break;
                case 'select':
                  await page.selectOption(input.selector, input.value);
                  break;
                case 'checkbox':
                  const isChecked = await page.isChecked(input.selector);
                  const shouldCheck = input.value.toLowerCase() === 'true';
                  if (isChecked !== shouldCheck) {
                    await page.check(input.selector);
                  }
                  break;
                case 'radio':
                  await page.check(input.selector);
                  break;
              }
              
              logger.info(`✅ Filled input: ${input.selector} = ${input.value}`);
              await page.waitForTimeout(500); // Small delay between inputs
            } catch (error) {
              logger.error(`❌ Error filling input ${input.selector}:`, error);
              throw error;
            }
          }
          
          // Take screenshot after filling if requested
          if (step.takeScreenshotAfterFill) {
            const fillScreenshotPath = path.join(screenshotDir, `step-${stepIndex + 1}-filled.png`);
            await page.screenshot({ path: fillScreenshotPath, fullPage: true });
            screenshotPaths.push(fillScreenshotPath);
            logger.info(`📸 Screenshot taken after filling: ${fillScreenshotPath}`);
          }
        }
        
        // Submit form if trigger is provided
        if (step.submitTrigger) {
          logger.info(`🚀 Submitting form with trigger: ${step.submitTrigger.selector}`);
          
          try {
            await page.waitForSelector(step.submitTrigger.selector, { timeout: step.stepTimeout });
            await page.click(step.submitTrigger.selector);
            
            // Wait after submit
            await page.waitForTimeout(step.submitTrigger.waitAfter);
            
            // Take screenshot after submit if requested
            if (step.takeScreenshotAfterSubmit) {
              const submitScreenshotPath = path.join(screenshotDir, `step-${stepIndex + 1}-submitted.png`);
              await page.screenshot({ path: submitScreenshotPath, fullPage: true });
              screenshotPaths.push(submitScreenshotPath);
              logger.info(`📸 Screenshot taken after submit: ${submitScreenshotPath}`);
            }
          } catch (error) {
            logger.error(`❌ Error submitting form:`, error);
            throw error;
          }
        }
        
        // Perform validation checks if provided
        if (step.validationChecks && step.validationChecks.length > 0) {
          logger.info(`🔍 Performing ${step.validationChecks.length} validation checks`);
          
          for (const validation of step.validationChecks) {
            try {
              switch (validation.checkType) {
                case 'exists':
                  await page.waitForSelector(validation.selector, { timeout: step.stepTimeout });
                  logger.info(`✅ Element exists: ${validation.selector}`);
                  break;
                case 'text':
                  const element = await page.waitForSelector(validation.selector, { timeout: step.stepTimeout });
                  const text = await element?.textContent();
                  if (validation.expectedText && text?.includes(validation.expectedText)) {
                    logger.info(`✅ Text validation passed: ${validation.selector} contains "${validation.expectedText}"`);
                  } else {
                    logger.warn(`⚠️ Text validation failed: ${validation.selector} does not contain "${validation.expectedText}"`);
                  }
                  break;
                case 'class':
                  const hasClass = await page.evaluate(`
                    (() => {
                      const el = document.querySelector('${validation.selector.replace(/'/g, "\\'")}')
                      return el?.classList.contains('${(validation.expectedText || '').replace(/'/g, "\\'")}')
                    })()
                  `);
                  logger.info(`${hasClass ? '✅' : '⚠️'} Class validation: ${validation.selector} ${hasClass ? 'has' : 'missing'} class "${validation.expectedText}"`);
                  break;
                case 'attribute':
                  const attrValue = await page.getAttribute(validation.selector, validation.expectedText || '');
                  logger.info(`${attrValue ? '✅' : '⚠️'} Attribute validation: ${validation.selector} attribute "${validation.expectedText}" = "${attrValue}"`);
                  break;
              }
            } catch (error) {
              logger.warn(`⚠️ Validation check failed for ${validation.selector}:`, error);
            }
          }
          
          // Take screenshot after validation if requested
          if (step.takeScreenshotAfterValidation) {
            const validationScreenshotPath = path.join(screenshotDir, `step-${stepIndex + 1}-validated.png`);
            await page.screenshot({ path: validationScreenshotPath, fullPage: true });
            screenshotPaths.push(validationScreenshotPath);
            logger.info(`📸 Screenshot taken after validation: ${validationScreenshotPath}`);
          }
        }
        
        logger.info(`✅ Completed step ${stepIndex + 1}: ${step.stepName}`);
      }
      
      logger.info(`🎉 Form automation completed successfully. Generated ${screenshotPaths.length} screenshots.`);
      return screenshotPaths;
      
    } catch (error) {
      logger.error('❌ Error in form automation:', error);
      throw error;
    }
  }

  /**
   * Scroll through the entire page to ensure all content is loaded before screenshot
   */
  private async scrollFullPage(page: Page): Promise<void> {
    try {
      // Get page dimensions
      const pageHeight = await page.evaluate(`
        Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        )
      `);

      const viewportHeight = await page.evaluate(`window.innerHeight`) as number;
      const scrollSteps = Math.ceil((pageHeight as number) / viewportHeight);
      
      logger.info(`📜 Scrolling through page: ${scrollSteps} steps (${pageHeight}px total height)`);

      // Scroll down in steps to trigger lazy loading
      for (let i = 0; i <= scrollSteps; i++) {
        const scrollY = (i * viewportHeight);
        await page.evaluate(`window.scrollTo(0, ${scrollY})`);
        
        // Wait for content to load after each scroll
        await page.waitForTimeout(500);
        
        // Trigger any lazy loading by dispatching scroll events
        await page.evaluate(`
          window.dispatchEvent(new Event('scroll'));
          window.dispatchEvent(new Event('resize'));
        `);
        
        // Wait for network requests to complete (lazy loading)
        try {
          await page.waitForLoadState('networkidle', { timeout: 2000 });
        } catch {
          // Continue if networkidle times out
        }
      }

      // Scroll back to top
      await page.evaluate(`window.scrollTo(0, 0)`);
      
      // Wait for any final content to settle and trigger final events
      await page.evaluate(`
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
      `);
      
      await page.waitForTimeout(1000);
      
      logger.info('✅ Full page scroll completed');
    } catch (error) {
      logger.warn('⚠️ Error during full page scroll:', error);
    }
  }

  /**
   * Navigate to URL with human-like behavior and anti-bot measures
   */
  private async humanLikeNavigation(page: Page, url: string, timeout: number = 60000): Promise<void> {
    const humanBehaviorEnabled = process.env.HUMAN_BEHAVIOR_ENABLED === 'true';
    const minDelay = parseInt(process.env.MIN_INTERACTION_DELAY || '200');
    const maxDelay = parseInt(process.env.MAX_INTERACTION_DELAY || '2000');
    
    try {
      if (humanBehaviorEnabled) {
        // Add random delay before navigation (simulate user thinking time)
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        await page.waitForTimeout(delay);
      }
      
      // Set additional anti-bot headers just before navigation
      await page.setExtraHTTPHeaders({
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Ch-Ua-Platform-Version': '"13.0.0"',
        'Sec-Ch-Ua-Full-Version-List': '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.109", "Google Chrome";v="120.0.6099.109"'
      });
      
      // Navigate with realistic options
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: timeout
      });
      
      if (humanBehaviorEnabled) {
        // Add human-like behavior after page load
        const postLoadDelay = Math.random() * (maxDelay - minDelay) + minDelay;
        await page.waitForTimeout(postLoadDelay);
        
        // Simulate some mouse movement to appear more human
        await page.mouse.move(Math.random() * 100 + 50, Math.random() * 100 + 50);
        await page.waitForTimeout(Math.random() * 500 + 200);
      }
      
    } catch (error) {
      // Fallback to domcontentloaded if networkidle fails
      if (error instanceof Error && error.message.includes('Timeout')) {
        logger.warn(`Networkidle timeout for ${url}, trying domcontentloaded...`);
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: timeout
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Simulate human-like clicking behavior to avoid bot detection
   */
  private async humanLikeClick(page: Page, element: any): Promise<void> {
    try {
      // Get element bounding box
      const box = await element.boundingBox();
      if (!box) {
        // Fallback to regular click if no bounding box
        await element.click();
        return;
      }

      // Calculate random click position within element (avoid exact center)
      const x = box.x + (box.width * (0.3 + Math.random() * 0.4)); // 30-70% of width
      const y = box.y + (box.height * (0.3 + Math.random() * 0.4)); // 30-70% of height

      // Add small random movement before clicking (simulate mouse approach)
      const startX = x + (Math.random() - 0.5) * 50;
      const startY = y + (Math.random() - 0.5) * 50;
      
      // Move mouse to starting position
      await page.mouse.move(startX, startY);
      await page.waitForTimeout(Math.random() * 100 + 50); // 50-150ms
      
      // Move to target position with slight curve
      const midX = (startX + x) / 2 + (Math.random() - 0.5) * 20;
      const midY = (startY + y) / 2 + (Math.random() - 0.5) * 20;
      
      await page.mouse.move(midX, midY);
      await page.waitForTimeout(Math.random() * 50 + 25); // 25-75ms
      
      await page.mouse.move(x, y);
      await page.waitForTimeout(Math.random() * 100 + 50); // 50-150ms hover
      
      // Click with realistic timing
      await page.mouse.down();
      await page.waitForTimeout(Math.random() * 50 + 50); // 50-100ms click duration
      await page.mouse.up();
      
      // Small delay after click
      await page.waitForTimeout(Math.random() * 200 + 100); // 100-300ms
      
    } catch (error) {
      logger.warn('Human-like click failed, falling back to regular click:', error);
      await element.click();
    }
  }

  /**
   * Execute trigger selectors and capture screenshots for each interaction
   */
  private async executeTriggerSelectors(
    page: Page, 
    triggerSelectors: Array<{
      selector: string;
      delay: number;
      waitAfter: number;
      description?: string;
    }>,
    screenshotId: string,
    projectId: string,
    userId: string
  ): Promise<IScreenshot[]> {
    const screenshots: IScreenshot[] = [];
    
    logger.info(`🎯 Executing ${triggerSelectors.length} trigger selectors for screenshot ${screenshotId}`);
    
    for (let i = 0; i < triggerSelectors.length; i++) {
      const trigger = triggerSelectors[i];
      if (!trigger) continue;
      
      try {
        logger.info(`🎯 Trigger ${i + 1}/${triggerSelectors.length}: ${trigger.description || trigger.selector}`);
        
        // Wait for the delay before clicking
        if (trigger.delay > 0) {
          logger.info(`⏳ Waiting ${trigger.delay}ms before clicking ${trigger.selector}`);
          await page.waitForTimeout(trigger.delay);
        }
        
        // Check if element exists
        const element = await page.$(trigger.selector);
        if (!element) {
          logger.warn(`⚠️ Element not found: ${trigger.selector}`);
          continue;
        }
        
        // Scroll element into view with human-like behavior
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(Math.random() * 500 + 200); // Random delay 200-700ms
        
        // Human-like mouse movement and click
        logger.info(`🖱️ Clicking element: ${trigger.selector}`);
        await this.humanLikeClick(page, element);
        
        // Wait after clicking
        if (trigger.waitAfter > 0) {
          logger.info(`⏳ Waiting ${trigger.waitAfter}ms after clicking ${trigger.selector}`);
          await page.waitForTimeout(trigger.waitAfter);
        }
        
        // Capture screenshot after the interaction
        const triggerScreenshotId = `${screenshotId}_trigger_${i + 1}`;
        const screenshotBuffer = await page.screenshot({ 
          fullPage: true,
          type: 'png'
        });
        
        // Save screenshot to file
        const filename = `${triggerScreenshotId}.png`;
        const filepath = path.join(this.screenshotsDir, filename);
        await fs.writeFile(filepath, screenshotBuffer);
        
        // Create screenshot document with proper ObjectId
        const screenshot = new Screenshot({
          // Let MongoDB generate the ObjectId automatically
          url: page.url(),
          imagePath: `/uploads/screenshots/${filename}`,
          status: 'completed',
          type: 'normal', // Add required type field (trigger screenshots are normal type)
          projectId,
          metadata: {
            title: trigger.description || `Trigger ${i + 1}: ${trigger.selector}`,
            timestamp: new Date().toISOString(),
            // Flatten trigger information for frontend compatibility
            triggerSelector: trigger.selector,
            triggerDescription: trigger.description,
            triggerIndex: i,
            totalTriggers: triggerSelectors.length,
            parentScreenshotId: screenshotId,
            // Legacy nested format for backward compatibility
            triggerInfo: {
              selector: trigger.selector,
              description: trigger.description,
              triggerIndex: i + 1,
              totalTriggers: triggerSelectors.length,
              parentScreenshotId: screenshotId
            }
          }
        });
        
        await screenshot.save();
        screenshots.push(screenshot.toObject());
        
        // Use the actual screenshot ID after save
        const actualScreenshotId = screenshot._id.toString();
        logger.info(`✅ Trigger screenshot ${i + 1} captured: ${actualScreenshotId}`);
        logger.info(`📊 Screenshot saved to database with ID: ${actualScreenshotId}`);
        
        // Emit socket event for real-time updates
        logger.info(`🔔 Emitting screenshotCompleted event for: ${actualScreenshotId}`);
        io.emit('screenshotCompleted', {
          screenshotId: actualScreenshotId,
          projectId,
          screenshot: screenshot.toObject()
        });
        
      } catch (error) {
        logger.error(`❌ Error executing trigger ${i + 1} (${trigger.selector}):`, error);
        // Continue with next trigger even if one fails
        continue;
      }
    }
    
    logger.info(`🎯 Completed trigger selectors. Generated ${screenshots.length} screenshots.`);
    return screenshots;
  }

  async captureScreenshot(data: ScreenshotJobData): Promise<void> {
    const { 
      screenshotId, 
      url, 
      userId, 
      projectId,
      type, 
      collectionId, 
      collectionName,
      cookiePrevention,
      deviceScaleFactor,
      width,
      height,
      fullPage,
      unsticky,
      customCSS,
      customJS,
      injectBeforeNavigation,
      injectBeforeViewport,
      basicAuth,
      customCookies
    } = data;
    
    // Extract trigger selectors for interactive screenshots
    const { triggerSelectors } = data;
    
    // Extract form steps for form automation
    const { formSteps } = data;
    
    // DEBUG: Track function calls to detect duplicates
    logger.info(`🔥 captureScreenshot STARTED for screenshotId: ${screenshotId}`, {
      screenshotId,
      url,
      userId,
      type,
      collectionId,
      timestamp: new Date().toISOString()
    });
    
    // Create metadata for collection screenshots
    const metadata = collectionId ? {
      isCollection: true,
      collectionId,
      collectionName
    } : undefined;
    
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
        stage: 'Initializing browser...',
        metadata
      });

      // Emit progress: browser ready
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 10,
        stage: 'Browser ready, creating page...',
        metadata
      });

      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Emit progress: configuring page
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 20,
        stage: 'Configuring page settings...',
        metadata
      });

      // Configure page with cookie prevention and other settings
      await this.configurePageForScreenshot(page, {
        ...(cookiePrevention !== undefined && { cookiePrevention }),
        ...(deviceScaleFactor !== undefined && { deviceScaleFactor }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(fullPage !== undefined && { fullPage }),
        ...(unsticky !== undefined && { unsticky }),
        ...(customCSS !== undefined && { customCSS }),
        ...(customJS !== undefined && { customJS }),
        ...(injectBeforeNavigation !== undefined && { injectBeforeNavigation }),
        ...(injectBeforeViewport !== undefined && { injectBeforeViewport }),
        ...(basicAuth !== undefined && { basicAuth }),
        ...(customCookies !== undefined && { customCookies })
      });

      // Emit progress: navigating to URL
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 30,
        stage: `Navigating to ${url}...`,
        metadata
      });

      // Navigate to URL with human-like behavior and anti-bot measures
      try {
        await this.humanLikeNavigation(page, url, parseInt(process.env.SCREENSHOT_TIMEOUT || '60000'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          logger.warn(`Navigation timeout for ${url}, retrying...`);
          
          io.to(`user-${userId}`).emit('screenshot-progress', {
            screenshotId,
            status: 'processing',
            progress: 35,
            stage: 'Retrying with faster loading strategy...'
          });
          
          // Final fallback - direct navigation
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
        stage: 'Page loaded, waiting for content...',
        metadata
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Inject CSS/JS after navigation if timing is set to after navigation (default)
      if (!injectBeforeNavigation && (customCSS || customJS)) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 55,
          stage: 'Injecting custom CSS/JS...',
          metadata
        });
        
        await this.injectCustomCSSJS(page, customCSS, customJS);
      }

      // Perform full page scroll if enabled to trigger lazy loading
      if (fullPage) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 55,
          stage: 'Scrolling through page to load all content...',
          metadata
        });
        
        await this.scrollFullPage(page);
        
        // Conditionally make sticky elements static based on unsticky option
        if (unsticky) {
          io.to(`user-${userId}`).emit('screenshot-progress', {
            screenshotId,
            status: 'processing',
            progress: 65,
            stage: 'Converting sticky elements to static positioning...',
            metadata
          });
          
          await this.makeStickyElementsStatic(page);
        } else {
          // Just scroll to bottom for natural sticky behavior
          io.to(`user-${userId}`).emit('screenshot-progress', {
            screenshotId,
            status: 'processing',
            progress: 65,
            stage: 'Scrolling to bottom for natural sticky positioning...',
            metadata
          });
          
          // Scroll to bottom where sticky elements naturally become unsticky
          await page.evaluate(`
            window.scrollTo(0, document.body.scrollHeight);
          `);
          await page.waitForTimeout(1000); // Wait for scroll and sticky elements to settle
        }
      }

      // Get page title
      const title = await page.title();

      // Get screenshot record to check if it belongs to a collection
      const screenshot = await Screenshot.findById(screenshotId);
      const collectionId = screenshot?.collectionId?.toString();

      // Create organized directory structure
      const screenshotDir = await this.ensureScreenshotDirectory(screenshotId, collectionId);
      
      const imagePath = path.join(screenshotDir, 'full.png');
      const thumbnailPath = path.join(screenshotDir, 'thumbnail.png');

      // Execute trigger selectors if provided (only for individual screenshots, not collections)
      let triggerScreenshots: IScreenshot[] = [];
      if (triggerSelectors && triggerSelectors.length > 0 && !collectionId) {
        logger.info(`🎯 Executing ${triggerSelectors.length} trigger selectors before main screenshot`);
        
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 60,
          stage: `Executing ${triggerSelectors.length} trigger actions...`,
          metadata
        });
        
        try {
          triggerScreenshots = await this.executeTriggerSelectors(
            page,
            triggerSelectors,
            screenshotId,
            projectId,
            userId
          );
          
          logger.info(`✅ Generated ${triggerScreenshots.length} trigger screenshots`);
        } catch (error) {
          logger.error('❌ Error executing trigger selectors:', error);
          // Continue with main screenshot even if triggers fail
        }
      }

      // Execute form automation if provided (only for individual screenshots, not collections)
      let formScreenshotPaths: string[] = [];
      if (formSteps && formSteps.length > 0 && !collectionId) {
        logger.info(`📝 Executing form automation with ${formSteps.length} steps`);
        
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 65,
          stage: `Executing form automation with ${formSteps.length} steps...`,
          metadata
        });
        
        try {
          formScreenshotPaths = await this.executeFormAutomation(
            page,
            formSteps,
            screenshotDir,
            userId,
            screenshotId
          );
          
          logger.info(`✅ Generated ${formScreenshotPaths.length} form automation screenshots`);
        } catch (error) {
          logger.error('❌ Error executing form automation:', error);
          // Continue with main screenshot even if form automation fails
        }
      }

      // Emit progress: taking screenshot
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'processing',
        progress: 70,
        stage: 'Capturing main screenshot...',
        metadata
      });

      // Take screenshot with user-provided dimensions and fullPage option
      logger.info(`🔍 Screenshot options debug:`, {
        fullPageParam: fullPage,
        widthParam: width,
        heightParam: height,
        fullPageResolved: fullPage !== undefined ? fullPage : true
      });
      
      const screenshotOptions: any = {
        path: imagePath,
        type: 'png',
        fullPage: fullPage !== undefined ? fullPage : true
      };
      
      // For full page screenshots, keep it natural and simple
      if (screenshotOptions.fullPage) {
        // Debug: Log page dimensions and scroll position
        const pageInfo = await page.evaluate(`({
          scrollTop: window.pageYOffset || document.documentElement.scrollTop,
          scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
          pageHeight: Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          ),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth
        })`);
        
        logger.info(`📊 Page info before natural full page screenshot:`, pageInfo);
      }
      
      // If not full page, use clip with user dimensions or viewport dimensions
      if (!screenshotOptions.fullPage) {
        const clipWidth = width || 1920;
        const clipHeight = height || 1080;
        screenshotOptions.clip = {
          x: 0,
          y: 0,
          width: clipWidth,
          height: clipHeight
        };
        logger.info(`📐 Using clip region: ${clipWidth}x${clipHeight}`);
      } else {
        logger.info(`📄 Using full page screenshot`);
      }
      
      logger.info(`📸 Final screenshot options:`, {
        fullPage: screenshotOptions.fullPage,
        hasClip: !!screenshotOptions.clip,
        clip: screenshotOptions.clip
      });
      
      const screenshotBuffer = await page.screenshot(screenshotOptions);

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

      const updatedScreenshot = await Screenshot.findByIdAndUpdate(screenshotId, {
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
      }, { new: true }); // Return the updated document

      // Emit completion progress
      io.to(`user-${userId}`).emit('screenshot-progress', {
        screenshotId,
        status: 'completed',
        progress: 100,
        stage: 'Screenshot completed!',
        url, // Add URL for frontend to create complete screenshot object
        imagePath: `${relativePath}/full.png`,
        thumbnailPath: `${relativePath}/thumbnail.png`,
        createdAt: updatedScreenshot?.createdAt, // Add actual creation date for consistency
        type: updatedScreenshot?.type, // Add type for frontend filtering
        collectionId: updatedScreenshot?.collectionId, // Add collectionId for frontend filtering
        metadata: {
          title,
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: stats.size,
          capturedAt: new Date(),
          ...(metadata || {})
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
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      });

      throw error;
    }
  }

  async captureFrameScreenshot(data: any): Promise<void> {
    // Debug logging for received job data
    logger.info(`📬 Frame job received`, {
      collectionId: data.collectionId,
      frameIndex: data.frameIndex,
      autoScroll: data.autoScroll,
      autoScrollEnabled: data.autoScroll?.enabled,
      isScrollCapture: data.isScrollCapture
    });
    
    const { 
      collectionId, 
      url, 
      userId, 
      frameDelay, 
      frameIndex, 
      totalFrames, 
      autoScroll, 
      isScrollCapture, 
      projectId,
      cookiePrevention,
      deviceScaleFactor,
      width,
      height,
      fullPage,
      unsticky,
      customCSS,
      customJS,
      injectBeforeNavigation,
      injectBeforeViewport,
      basicAuth,
      customCookies
    } = data;
    
    let screenshotId: string | undefined;
    
    try {
      // Create the screenshot record (similar to crawl approach)
      const newScreenshot = new Screenshot({
        projectId,
        url,
        imagePath: '', // Will be updated when captured
        type: 'frame',
        collectionId,
        status: 'processing',
        metadata: {
          frameDelay,
          frameIndex,
          totalFrames
        }
      });
      
      await newScreenshot.save();
      screenshotId = newScreenshot._id.toString();

      // No individual screenshot progress - only collection progress
      // This prevents individual progress indicators from showing

      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Configure page with cookie prevention and other settings
      await this.configurePageForScreenshot(page, {
        ...(cookiePrevention !== undefined && { cookiePrevention }),
        ...(deviceScaleFactor !== undefined && { deviceScaleFactor }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(fullPage !== undefined && { fullPage }),
        ...(unsticky !== undefined && { unsticky }),
        ...(customCSS !== undefined && { customCSS }),
        ...(customJS !== undefined && { customJS }),
        ...(injectBeforeNavigation !== undefined && { injectBeforeNavigation }),
        ...(injectBeforeViewport !== undefined && { injectBeforeViewport }),
        ...(basicAuth !== undefined && { basicAuth }),
        ...(customCookies !== undefined && { customCookies })
      });

      // Emit progress: navigating to URL
      // Ensure screenshotId is defined before using it in emit
      if (screenshotId) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 20,
          stage: `Loading ${url}...`
        });
      }

      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: parseInt(process.env.SCREENSHOT_TIMEOUT || '30000')
      });

      // Wait for the specified frame delay
      if (frameDelay > 0) {
        // Ensure screenshotId is defined before using it in emit
        if (screenshotId) {
          io.to(`user-${userId}`).emit('screenshot-progress', {
            screenshotId,
            status: 'processing',
            progress: 40,
            stage: `Waiting ${frameDelay}s for frame timing...`
          });
        }
        
        await page.waitForTimeout(frameDelay * 1000);
      }

      // Emit progress: taking screenshot
      // Ensure screenshotId is defined before using it in emit
      if (screenshotId) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 60,
          stage: 'Taking screenshot...'
        });
      }

      // Get the screenshot document to find collectionId
      // Ensure screenshotId is defined before querying database
      if (!screenshotId) {
        throw new Error('Screenshot ID is undefined');
      }
      const screenshot = await Screenshot.findById(screenshotId);
      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // Create directory for this screenshot
      // Ensure screenshotId is defined before using it
      if (!screenshotId) {
        throw new Error('Screenshot ID is undefined');
      }
      const screenshotDir = await this.ensureScreenshotDirectory(screenshotId, screenshot.collectionId?.toString());
      
      // Take the screenshot
      const screenshotPath = path.join(screenshotDir, 'screenshot.png');
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        type: 'png'
      });

      // Emit progress: processing image
      // Ensure screenshotId is defined before using it in emit
      if (screenshotId) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'processing',
          progress: 80,
          stage: 'Processing image...'
        });
      }

      // Create thumbnail
      const thumbnailPath = path.join(screenshotDir, 'thumbnail.jpg');
      await sharp(screenshotPath)
        .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Update screenshot with paths (include uploads/ prefix for image controller)
      // Ensure screenshotId is defined before using it
      if (!screenshotId) {
        throw new Error('Screenshot ID is undefined');
      }
      const relativePath = screenshot.collectionId 
        ? path.join('uploads', 'collections', screenshot.collectionId.toString(), screenshotId, 'screenshot.png')
        : path.join('uploads', 'screenshots', screenshotId, 'screenshot.png');
      
      // Ensure screenshotId is defined before using it
      if (!screenshotId) {
        throw new Error('Screenshot ID is undefined');
      }
      const relativeThumbnailPath = screenshot.collectionId 
        ? path.join('uploads', 'collections', screenshot.collectionId.toString(), screenshotId, 'thumbnail.jpg')
        : path.join('uploads', 'screenshots', screenshotId, 'thumbnail.jpg');

      const updatedScreenshot = await Screenshot.findByIdAndUpdate(screenshotId, {
        imagePath: relativePath,
        thumbnailPath: relativeThumbnailPath,
        status: 'completed'
      }, { new: true }); // Return the updated document

      await page.close();

      // Emit completion
      // Ensure screenshotId is defined before using it in emit
      if (screenshotId) {
        io.to(`user-${userId}`).emit('screenshot-progress', {
          screenshotId,
          status: 'completed',
          progress: 100,
          stage: `Frame ${frameIndex}/${totalFrames} completed!`,
          url: updatedScreenshot?.url || url, // Add URL for frontend
          type: updatedScreenshot?.type, // Add type for filtering
          collectionId: updatedScreenshot?.collectionId, // Add collectionId for filtering
          createdAt: updatedScreenshot?.createdAt, // Add creation date for consistency
          imagePath: relativePath,
          thumbnailPath: relativeThumbnailPath,
          metadata: {
            title: updatedScreenshot?.metadata?.title || 'Frame Screenshot',
            frameIndex,
            totalFrames,
            frameDelay
          }
        });
      }

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
        const collectionProgressData = {
          collectionId: screenshot.collectionId.toString(),
          totalScreenshots: totalFrames,
          completedScreenshots: completedTimeFrames,
          progress,
          stage: `Captured ${completedTimeFrames}/${totalFrames} frames`,
          url: screenshot.url,
          type: 'frame' as const,
          startTime: Date.now()
        };
        
        logger.info(`📡 Emitting collection progress`, {
          userId,
          collectionProgressData,
          hasUrl: !!collectionProgressData.url,
          hasType: !!collectionProgressData.type
        });
        
        io.to(`user-${userId}`).emit('collection-progress', collectionProgressData);
        
        // Debug completion condition
        logger.info(`🔍 Checking completion condition`, {
          progress,
          completedTimeFrames,
          totalFrames,
          completedGreaterOrEqual: completedTimeFrames >= totalFrames,
          hasCollectionId: !!screenshot.collectionId,
          shouldComplete: completedTimeFrames >= totalFrames && screenshot.collectionId
        });
        
        // Check if collection is fully completed (all frames done)
        // Use >= 100 to handle rounding issues and simplify autoScroll check
        if (completedTimeFrames >= totalFrames && screenshot.collectionId) {
          logger.info(`✅ Collection fully completed`, {
            collectionId: screenshot.collectionId.toString(),
            completedTimeFrames,
            totalFrames
          });
          
          // Update collection with completed status and refresh timestamp
          await Collection.findByIdAndUpdate(screenshot.collectionId, {
            status: 'completed',
            updatedAt: new Date() // This ensures it appears first in sorted list
          });
          
          // Emit final completion event to clear progress state
          const completionData = {
            collectionId: screenshot.collectionId.toString(),
            totalScreenshots: totalFrames,
            completedScreenshots: totalFrames,
            progress: 100,
            stage: 'Collection completed!',
            url: screenshot.url,
            type: 'frame' as const,
            startTime: Date.now(),
            completed: true // Flag to indicate completion
          };
          
          logger.info(`🎉 Emitting final completion event`, {
            userId,
            completionData,
            room: `user-${userId}`
          });
          
          io.to(`user-${userId}`).emit('collection-progress', completionData);
          
          // Clear progress after a short delay to allow UI to show completion
          setTimeout(() => {
            if (screenshot.collectionId) {
              logger.info(`🧹 Emitting collection progress clear event`, {
                userId,
                collectionId: screenshot.collectionId.toString(),
                room: `user-${userId}`
              });
              
              io.to(`user-${userId}`).emit('collection-progress-clear', {
                collectionId: screenshot.collectionId.toString()
              });
            }
          }, 2000);
        }
        
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
            url: screenshot.url,
            type: 'frame' as const,
            startTime: Date.now(),
            isScrolling: true
          });
          
          await this.startAutoScrollCapture({
            url,
            projectId,
            userId,
            collectionId: screenshot.collectionId.toString(),
            autoScroll,
            totalFrames,
            cookiePrevention,
            deviceScaleFactor,
            customCSS,
            customJS,
            basicAuth,
            customCookies
          });
        }
      }

      logger.info(`Frame screenshot captured successfully for ${url} at ${frameDelay}s`, { screenshotId, frameIndex, totalFrames });

    } catch (error) {
      logger.error(`Frame screenshot capture failed for ${url}:`, error);
      
      // Update screenshot status to failed if it was created
      if (screenshotId) {
        await Screenshot.findByIdAndUpdate(screenshotId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // No individual progress emits - collection progress will handle failures

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
    // Screenshot options
    cookiePrevention?: boolean;
    deviceScaleFactor?: number;
    width?: number;
    height?: number;
    fullPage?: boolean;
    unsticky?: boolean;
    customCSS?: string;
    customJS?: string;
    injectBeforeNavigation?: boolean;
    injectBeforeViewport?: boolean;
    // Authentication options
    basicAuth?: {
      username: string;
      password: string;
    };
    // Cookie injection
    customCookies?: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }>;
    triggerSelectors?: Array<{
      selector: string;
      delay: number;
      waitAfter: number;
      description?: string;
    }>;
  }): Promise<void> {
    const { 
      url, 
      projectId, 
      userId, 
      collectionId, 
      totalFrames, 
      autoScroll,
      cookiePrevention,
      deviceScaleFactor,
      width,
      height,
      fullPage,
      unsticky,
      customCSS,
      customJS,
      injectBeforeNavigation,
      injectBeforeViewport,
      basicAuth,
      customCookies
    } = data;
    
    try {
      logger.info(`🔄 Starting auto-scroll capture for ${url}`, {
        collectionId,
        selector: autoScroll.selector,
        stepSize: autoScroll.stepSize,
        interval: autoScroll.interval
      });
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Configure page with cookie prevention and other settings
      await this.configurePageForScreenshot(page, {
        ...(cookiePrevention !== undefined && { cookiePrevention }),
        ...(deviceScaleFactor !== undefined && { deviceScaleFactor }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(fullPage !== undefined && { fullPage }),
        ...(unsticky !== undefined && { unsticky }),
        ...(customCSS !== undefined && { customCSS }),
        ...(customJS !== undefined && { customJS }),
        ...(injectBeforeNavigation !== undefined && { injectBeforeNavigation }),
        ...(injectBeforeViewport !== undefined && { injectBeforeViewport }),
        ...(basicAuth !== undefined && { basicAuth }),
        ...(customCookies !== undefined && { customCookies })
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
          url,
          type: 'crawl' as const,
          startTime: Date.now(),
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
        url,
        type: 'crawl' as const,
        startTime: Date.now(),
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
        url,
        type: 'crawl' as const,
        startTime: Date.now(),
        isScrolling: false
      });
    }
  }

  async captureCrawlScreenshots(data: CrawlJobData): Promise<void> {
    const { 
      collectionId, 
      urls, 
      projectId, 
      userId,
      cookiePrevention,
      deviceScaleFactor,
      width,
      height,
      fullPage,
      unsticky,
      customCSS,
      customJS,
      injectBeforeNavigation,
      injectBeforeViewport,
      basicAuth,
      customCookies
    } = data;

    try {
      logger.info(`Starting crawl screenshot capture for ${urls.length} URLs`, { collectionId });
      
      // Get collection name for metadata
      const collection = await Collection.findById(collectionId);
      const collectionName = collection?.name || 'Untitled Collection';

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

      // Emit initial crawl progress with correct type
      io.to(`user-${userId}`).emit('collection-progress', {
        collectionId,
        totalScreenshots: screenshots.length,
        completedScreenshots: 0,
        progress: 0,
        stage: 'Starting crawl capture...',
        url: urls.length === 1 ? urls[0] : `${urls.length} URLs`,
        type: 'crawl' as const,
        startTime: Date.now()
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
            type: 'crawl',
            collectionId,
            collectionName,
            ...(cookiePrevention !== undefined && { cookiePrevention }),
            ...(deviceScaleFactor !== undefined && { deviceScaleFactor }),
            ...(width !== undefined && { width }),
            ...(height !== undefined && { height }),
            ...(fullPage !== undefined && { fullPage }),
        ...(unsticky !== undefined && { unsticky }),
            ...(customCSS !== undefined && { customCSS }),
            ...(customJS !== undefined && { customJS }),
            ...(injectBeforeNavigation !== undefined && { injectBeforeNavigation })
          });
          
          completedCount++;
          const progress = Math.round((completedCount / screenshots.length) * 100);
          
          // Emit crawl progress update
          io.to(`user-${userId}`).emit('collection-progress', {
            collectionId,
            totalScreenshots: screenshots.length,
            completedScreenshots: completedCount,
            progress,
            stage: `Captured ${completedCount}/${screenshots.length} screenshots`,
            url: screenshot.url,
            type: 'crawl' as const,
            startTime: Date.now()
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
          
          // Configure page with cookie prevention and other settings
          await this.configurePageForScreenshot(page);

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

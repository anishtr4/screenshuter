import { User } from '../models/User';
import { Config } from '../models/Config';
import { logger } from '../config/logger';

export const createDefaultAdmin = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!existingAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@screenshot-saas.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      const adminUser = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'super_admin',
        tokenCreationEnabled: true,
        active: true
      });

      await adminUser.save();
      logger.info(`Default admin user created: ${adminEmail}`);
    }

    // Create default configuration values
    const defaultConfigs = [
      {
        key: 'free_tier_screenshots_per_month',
        value: parseInt(process.env.DEFAULT_SCREENSHOTS_PER_MONTH || '100000'),
        description: 'Maximum number of screenshots a free user can take per month'
      },
      {
        key: 'free_tier_max_projects',
        value: parseInt(process.env.DEFAULT_MAX_PROJECTS || '10'),
        description: 'Maximum number of projects a free user can create'
      },
      {
        key: 'crawl_max_depth',
        value: parseInt(process.env.CRAWL_MAX_DEPTH || '2'),
        description: 'Maximum depth for URL crawling'
      },
      {
        key: 'crawl_max_pages',
        value: parseInt(process.env.CRAWL_MAX_PAGES || '50'),
        description: 'Maximum number of pages to crawl per session'
      },
      {
        key: 'screenshot_timeout',
        value: parseInt(process.env.SCREENSHOT_TIMEOUT || '30000'),
        description: 'Timeout for screenshot capture in milliseconds'
      }
    ];

    for (const configData of defaultConfigs) {
      const existingConfig = await Config.findOne({ key: configData.key });
      if (!existingConfig) {
        const config = new Config(configData);
        await config.save();
        logger.info(`Default config created: ${configData.key} = ${configData.value}`);
      }
    }

  } catch (error) {
    logger.error('Failed to create default admin user or configs:', error);
    throw error;
  }
};

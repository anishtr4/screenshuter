import path from 'path';
import fs from 'fs/promises';
import { Screenshot } from '../models/Screenshot';
import { logger } from '../config/logger';
import { connectDB } from '../config/database';

interface FileMapping {
  screenshotId: string;
  collectionId?: string;
  oldImagePath: string;
  oldThumbnailPath?: string;
  newImagePath: string;
  newThumbnailPath: string;
}

class FileMigration {
  private readonly oldUploadDir: string;
  private readonly oldThumbnailDir: string;
  private readonly newUploadDir: string;
  private readonly screenshotsDir: string;
  private readonly collectionsDir: string;

  constructor() {
    this.oldUploadDir = path.join(__dirname, '../../uploads');
    this.oldThumbnailDir = path.join(__dirname, '../../uploads/thumbnails');
    this.newUploadDir = path.join(__dirname, '../../uploads');
    this.screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
    this.collectionsDir = path.join(__dirname, '../../uploads/collections');
  }

  async migrate(): Promise<void> {
    try {
      logger.info('Starting file structure migration...');

      // Connect to database
      await connectDB();

      // Create new directory structure
      await this.createDirectories();

      // Get all screenshots from database
      const screenshots = await Screenshot.find({
        status: 'completed',
        imagePath: { $exists: true }
      });

      logger.info(`Found ${screenshots.length} screenshots to migrate`);

      const fileMappings: FileMapping[] = [];

      // Process each screenshot
      for (const screenshot of screenshots) {
        const screenshotId = screenshot._id.toString();
        const collectionId = screenshot.collectionId?.toString();

        // Create new directory for this screenshot
        const screenshotDir = collectionId 
          ? path.join(this.collectionsDir, collectionId, screenshotId)
          : path.join(this.screenshotsDir, screenshotId);

        await fs.mkdir(screenshotDir, { recursive: true });

        // Determine old file paths
        const oldImagePath = path.join(__dirname, '../../', screenshot.imagePath || '');
        const oldThumbnailPath = screenshot.thumbnailPath 
          ? path.join(__dirname, '../../', screenshot.thumbnailPath)
          : undefined;

        // Determine new file paths
        const newImagePath = path.join(screenshotDir, 'full.png');
        const newThumbnailPath = path.join(screenshotDir, 'thumbnail.png');

        // Create file mapping
        const mapping: FileMapping = {
          screenshotId,
          ...(collectionId && { collectionId }),
          oldImagePath,
          ...(oldThumbnailPath && { oldThumbnailPath }),
          newImagePath,
          newThumbnailPath
        };

        fileMappings.push(mapping);
      }

      // Move files
      await this.moveFiles(fileMappings);

      // Update database records
      await this.updateDatabaseRecords(fileMappings);

      logger.info('File structure migration completed successfully');

    } catch (error) {
      logger.error('File structure migration failed:', error);
      throw error;
    }
  }

  private async createDirectories(): Promise<void> {
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    await fs.mkdir(this.collectionsDir, { recursive: true });
    logger.info('Created new directory structure');
  }

  private async moveFiles(mappings: FileMapping[]): Promise<void> {
    let movedCount = 0;
    let errorCount = 0;

    for (const mapping of mappings) {
      try {
        // Move main image
        try {
          await fs.access(mapping.oldImagePath);
          await fs.copyFile(mapping.oldImagePath, mapping.newImagePath);
          logger.info(`Moved image: ${mapping.screenshotId}`);
        } catch (error) {
          logger.warn(`Image not found for screenshot ${mapping.screenshotId}: ${mapping.oldImagePath}`);
        }

        // Move thumbnail if it exists
        if (mapping.oldThumbnailPath) {
          try {
            await fs.access(mapping.oldThumbnailPath);
            await fs.copyFile(mapping.oldThumbnailPath, mapping.newThumbnailPath);
            logger.info(`Moved thumbnail: ${mapping.screenshotId}`);
          } catch (error) {
            logger.warn(`Thumbnail not found for screenshot ${mapping.screenshotId}: ${mapping.oldThumbnailPath}`);
          }
        }

        movedCount++;
      } catch (error) {
        logger.error(`Failed to move files for screenshot ${mapping.screenshotId}:`, error);
        errorCount++;
      }
    }

    logger.info(`File movement completed: ${movedCount} successful, ${errorCount} errors`);
  }

  private async updateDatabaseRecords(mappings: FileMapping[]): Promise<void> {
    let updatedCount = 0;
    let errorCount = 0;

    for (const mapping of mappings) {
      try {
        const relativePath = mapping.collectionId 
          ? `uploads/collections/${mapping.collectionId}/${mapping.screenshotId}`
          : `uploads/screenshots/${mapping.screenshotId}`;

        await Screenshot.findByIdAndUpdate(mapping.screenshotId, {
          imagePath: `${relativePath}/full.png`,
          thumbnailPath: `${relativePath}/thumbnail.png`
        });

        updatedCount++;
      } catch (error) {
        logger.error(`Failed to update database record for screenshot ${mapping.screenshotId}:`, error);
        errorCount++;
      }
    }

    logger.info(`Database update completed: ${updatedCount} successful, ${errorCount} errors`);
  }

  async cleanup(): Promise<void> {
    try {
      logger.info('Starting cleanup of old files...');

      // List all files in old directories
      const oldFiles = await fs.readdir(this.oldUploadDir);
      const oldThumbnails = await fs.readdir(this.oldThumbnailDir);

      // Remove old image files (but keep the new directories)
      for (const file of oldFiles) {
        const filePath = path.join(this.oldUploadDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && file.startsWith('screenshot-')) {
          await fs.unlink(filePath);
          logger.info(`Removed old file: ${file}`);
        }
      }

      // Remove old thumbnail files
      for (const file of oldThumbnails) {
        const filePath = path.join(this.oldThumbnailDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && file.startsWith('thumb-')) {
          await fs.unlink(filePath);
          logger.info(`Removed old thumbnail: ${file}`);
        }
      }

      // Remove old thumbnails directory if empty
      try {
        const remainingFiles = await fs.readdir(this.oldThumbnailDir);
        if (remainingFiles.length === 0) {
          await fs.rmdir(this.oldThumbnailDir);
          logger.info('Removed empty thumbnails directory');
        }
      } catch (error) {
        logger.warn('Could not remove thumbnails directory:', error);
      }

      logger.info('Cleanup completed');

    } catch (error) {
      logger.error('Cleanup failed:', error);
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new FileMigration();
  
  migration.migrate()
    .then(() => {
      console.log('Migration completed successfully');
      console.log('Run cleanup with: npm run migrate:cleanup');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { FileMigration };

import { Request, Response } from 'express';
import { Collection } from '../models/Collection';
import { Screenshot } from '../models/Screenshot';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const downloadCollection = asyncHandler(async (req: Request, res: Response) => {
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

  // Get all screenshots in this collection
  const screenshots = await Screenshot.find({ collectionId: id });
  
  if (!screenshots.length) {
    throw createError('No screenshots found in collection', 404);
  }

  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${collection.name || 'collection'}.zip"`);

  archive.pipe(res);

  // Add screenshots to archive
  for (const screenshot of screenshots) {
    if (screenshot.imagePath && fs.existsSync(screenshot.imagePath)) {
      const filename = `${screenshot.metadata?.title || screenshot.url || 'screenshot'}.png`;
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      archive.file(screenshot.imagePath, { name: sanitizedFilename });
    }
  }

  // Add metadata file
  const metadata = {
    collection: {
      name: collection.name,
      baseUrl: collection.baseUrl,
      createdAt: collection.createdAt
    },
    screenshots: screenshots.map(s => ({
      title: s.metadata?.title,
      url: s.url,
      createdAt: s.createdAt,
      metadata: s.metadata
    }))
  };

  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

  archive.finalize();

  logger.info(`Collection downloaded`, { collectionId: id, userId, screenshotCount: screenshots.length });
});

export const generateCollectionPDF = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;
  const config = req.body;

  const collection = await Collection.findById(id).populate('projectId');
  if (!collection) {
    throw createError('Collection not found', 404);
  }

  // Verify ownership
  const project = collection.projectId as any;
  if (project.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  // Get all screenshots in this collection
  const screenshots = await Screenshot.find({ collectionId: id });
  
  if (!screenshots.length) {
    throw createError('No screenshots found in collection', 404);
  }

  // Create PDF
  const doc = new PDFDocument({
    layout: config.layout || 'portrait',
    size: config.pageSize || 'A4',
    margin: config.margin || 20
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${config.title || collection.name || 'collection'}.pdf"`);

  doc.pipe(res);

  // Add title page
  doc.fontSize(24).text(config.title || collection.name || 'Collection', { align: 'center' });
  doc.moveDown();
  
  if (config.includeMetadata) {
    doc.fontSize(12);
    doc.text(`Base URL: ${collection.baseUrl}`, { align: 'center' });
    doc.text(`Screenshots: ${screenshots.length}`, { align: 'center' });
    if (config.includeDates) {
      doc.text(`Created: ${new Date(collection.createdAt).toLocaleDateString()}`, { align: 'center' });
    }
  }

  doc.addPage();

  // Add screenshots
  const imagesPerPage = config.imagesPerPage || 2;
  const pageWidth = doc.page.width - (config.margin * 2);
  const pageHeight = doc.page.height - (config.margin * 2);
  
  let currentPage = 0;
  let imagesOnCurrentPage = 0;

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    
    if (imagesOnCurrentPage >= imagesPerPage) {
      doc.addPage();
      imagesOnCurrentPage = 0;
      currentPage++;
    }

    if (screenshot?.imagePath && fs.existsSync(screenshot.imagePath)) {
      try {
        const imageWidth = pageWidth / (imagesPerPage > 1 ? 2 : 1) - 10;
        const imageHeight = imageWidth * 0.6; // Maintain aspect ratio
        
        const x = (imagesOnCurrentPage % 2) * (imageWidth + 10) + config.margin;
        const y = Math.floor(imagesOnCurrentPage / 2) * (imageHeight + 60) + config.margin;

        doc.image(screenshot.imagePath, x, y, {
          width: imageWidth,
          height: imageHeight,
          fit: [imageWidth, imageHeight]
        });

        // Add metadata below image
        if (config.includeMetadata) {
          doc.fontSize(8);
          const textY = y + imageHeight + 5;
          
          if (screenshot.metadata?.title) {
            doc.text(screenshot.metadata.title, x, textY, { width: imageWidth });
          }
          
          if (config.includeUrls && screenshot.url) {
            doc.text(screenshot.url, x, textY + 10, { width: imageWidth });
          }
          
          if (config.includeDates && screenshot.createdAt) {
            doc.text(new Date(screenshot.createdAt).toLocaleDateString(), x, textY + 20, { width: imageWidth });
          }
        }

        imagesOnCurrentPage++;
      } catch (error) {
        logger.error('Failed to add image to PDF', { error, screenshotId: screenshot?._id });
      }
    }
  }

  doc.end();

  logger.info(`Collection PDF generated`, { collectionId: id, userId, screenshotCount: screenshots.length });
});

import { Request, Response } from 'express';
import { Config } from '../models/Config';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export const getConfigs = asyncHandler(async (req: Request, res: Response) => {
  const configs = await Config.find().sort({ key: 1 });

  res.json({
    configs: configs.map(config => ({
      id: config._id,
      key: config.key,
      value: config.value,
      description: config.description,
      updatedAt: config.updatedAt
    }))
  });
});

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;

  const config = await Config.findOne({ key });
  if (!config) {
    throw createError('Configuration not found', 404);
  }

  res.json({
    config: {
      id: config._id,
      key: config.key,
      value: config.value,
      description: config.description,
      updatedAt: config.updatedAt
    }
  });
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { value } = req.body;

  const config = await Config.findById(id);
  if (!config) {
    throw createError('Configuration not found', 404);
  }

  const oldValue = config.value;
  config.value = value;
  config.updatedAt = new Date();

  await config.save();

  logger.info(`Configuration updated: ${config.key}`, { 
    configId: config._id,
    oldValue,
    newValue: value,
    updatedBy: req.user?.id
  });

  res.json({
    message: 'Configuration updated successfully',
    config: {
      id: config._id,
      key: config.key,
      value: config.value,
      description: config.description,
      updatedAt: config.updatedAt
    }
  });
});

export const createConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key, value, description } = req.body;

  // Check if config already exists
  const existingConfig = await Config.findOne({ key });
  if (existingConfig) {
    throw createError('Configuration with this key already exists', 409);
  }

  const config = new Config({
    key,
    value,
    description
  });

  await config.save();

  logger.info(`Configuration created: ${key}`, { 
    configId: config._id,
    value,
    createdBy: req.user?.id
  });

  res.status(201).json({
    message: 'Configuration created successfully',
    config: {
      id: config._id,
      key: config.key,
      value: config.value,
      description: config.description,
      updatedAt: config.updatedAt
    }
  });
});

export const deleteConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const config = await Config.findById(id);
  if (!config) {
    throw createError('Configuration not found', 404);
  }

  // Prevent deletion of critical configs
  const criticalConfigs = [
    'free_tier_screenshots_per_month',
    'free_tier_max_projects',
    'crawl_max_depth',
    'crawl_max_pages',
    'screenshot_timeout'
  ];

  if (criticalConfigs.includes(config.key)) {
    throw createError('Cannot delete critical configuration', 400);
  }

  await Config.findByIdAndDelete(id);

  logger.info(`Configuration deleted: ${config.key}`, { 
    configId: id,
    deletedBy: req.user?.id
  });

  res.json({
    message: 'Configuration deleted successfully'
  });
});

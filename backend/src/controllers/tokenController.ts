import { Request, Response } from 'express';
import { ApiToken } from '../models/ApiToken';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export const createToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { name } = req.body;
  const userId = req.user.id;

  // Check if token name already exists for this user
  const existingToken = await ApiToken.findOne({ userId, name, active: true });
  if (existingToken) {
    throw createError('Token with this name already exists', 409);
  }

  const apiToken = new ApiToken({
    userId,
    name
  });

  await apiToken.save();

  // Get the plain text token (only available during creation)
  // Since token field has select: false, we need to access it directly from the instance
  const plainTextToken = apiToken.token;

  logger.info(`API token created: ${name}`, { 
    tokenId: apiToken._id,
    userId 
  });

  res.status(201).json({
    message: 'API token created successfully',
    token: {
      id: apiToken._id,
      name: apiToken.name,
      token: plainTextToken, // Only shown once
      active: apiToken.active,
      createdAt: apiToken.createdAt
    },
    warning: 'This token will only be shown once. Please save it securely.'
  });
});

export const getTokens = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const userId = req.user.id;

  const tokens = await ApiToken.find({ userId })
    .select('-token -hashedToken') // Don't include sensitive fields
    .sort({ createdAt: -1 });

  res.json({
    tokens: tokens.map(token => ({
      id: token._id,
      name: token.name,
      active: token.active,
      lastUsed: token.lastUsed,
      createdAt: token.createdAt
    }))
  });
});

export const updateToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { active, name } = req.body;
  const userId = req.user.id;

  const token = await ApiToken.findOne({ _id: id, userId });
  if (!token) {
    throw createError('Token not found', 404);
  }

  // Update fields if provided
  if (typeof active === 'boolean') {
    token.active = active;
  }
  
  if (name && name !== token.name) {
    // Check if new name conflicts with existing tokens
    const existingToken = await ApiToken.findOne({ userId, name, active: true });
    if (existingToken && existingToken._id.toString() !== id) {
      throw createError('Token with this name already exists', 409);
    }
    token.name = name;
  }

  await token.save();

  logger.info(`API token updated: ${token.name}`, { 
    tokenId: token._id,
    userId,
    changes: { active, name }
  });

  res.json({
    message: 'Token updated successfully',
    token: {
      id: token._id,
      name: token.name,
      active: token.active,
      lastUsed: token.lastUsed,
      createdAt: token.createdAt
    }
  });
});

export const deleteToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { id } = req.params;
  const userId = req.user.id;

  const token = await ApiToken.findOne({ _id: id, userId });
  if (!token) {
    throw createError('Token not found', 404);
  }

  await ApiToken.findByIdAndDelete(id);

  logger.info(`API token deleted: ${token.name}`, { 
    tokenId: id,
    userId
  });

  res.json({
    message: 'Token deleted successfully'
  });
});

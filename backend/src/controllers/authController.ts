import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getRemainingLimits } from '../utils/checkLimits';
import { logger } from '../config/logger';

const generateToken = (user: any) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT secret not configured', 500);
  }

  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions;
  
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active
    },
    jwtSecret,
    options
  );
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User already exists with this email', 409);
  }

  // Create new user
  const user = new User({
    email,
    password,
    role: 'user',
    tokenCreationEnabled: false,
    active: true
  });

  await user.save();

  // Generate token
  const token = generateToken(user);

  // Get user limits
  const limits = await getRemainingLimits(user._id.toString());

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    },
    limits
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.active) {
    throw createError('Account is disabled. Please contact administrator.', 401);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user);

  // Get user limits
  const limits = await getRemainingLimits(user._id.toString());

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    },
    limits
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Get user limits
  const limits = await getRemainingLimits(user._id.toString());

  res.json({
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    },
    limits
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const user = await User.findById(req.user.id);
  if (!user || !user.active) {
    throw createError('User not found or inactive', 404);
  }

  // Generate new token
  const token = generateToken(user);

  res.json({
    message: 'Token refreshed successfully',
    token
  });
});

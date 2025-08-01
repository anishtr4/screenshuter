import { Request, Response } from 'express';
import { User } from '../models/User';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User already exists with this email', 409);
  }

  const user = new User({
    firstName,
    lastName,
    email,
    password,
    role,
    tokenCreationEnabled: false,
    active: true
  });

  await user.save();

  logger.info(`User created by admin: ${email}`, { 
    createdBy: req.user?.id,
    newUserId: user._id 
  });

  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    }
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, tokenCreationEnabled, active } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Prevent admin from disabling themselves
  if (req.user?.id === id && active === false) {
    throw createError('Cannot disable your own account', 400);
  }

  // Prevent admin from changing their own role
  if (req.user?.id === id && role && role !== user.role) {
    throw createError('Cannot change your own role', 400);
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError('User already exists with this email', 409);
    }
    user.email = email;
  }

  // Update fields if provided
  if (firstName) {
    user.firstName = firstName;
  }
  
  if (lastName) {
    user.lastName = lastName;
  }
  
  if (role && ['user', 'super_admin'].includes(role)) {
    user.role = role;
  }
  
  if (typeof tokenCreationEnabled === 'boolean') {
    user.tokenCreationEnabled = tokenCreationEnabled;
  }
  
  if (typeof active === 'boolean') {
    user.active = active;
  }

  await user.save();

  logger.info(`User updated by admin: ${user.email}`, { 
    updatedBy: req.user?.id,
    userId: user._id,
    changes: { firstName, lastName, email, role, tokenCreationEnabled, active }
  });

  res.json({
    message: 'User updated successfully',
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    }
  });
});

export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.active) {
    throw createError('User is already approved', 400);
  }

  user.active = true;
  await user.save();

  logger.info(`User approved by admin: ${user.email}`, { 
    approvedBy: req.user?.id,
    userId: user._id
  });

  res.json({
    message: 'User approved successfully',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active,
      createdAt: user.createdAt
    }
  });
});

export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
  const pendingUsers = await User.find({ active: false })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    users: pendingUsers,
    count: pendingUsers.length
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user?.id === id) {
    throw createError('Cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  await User.findByIdAndDelete(id);

  logger.info(`User deleted by admin: ${user.email}`, { 
    deletedBy: req.user?.id,
    deletedUserId: id
  });

  res.json({
    message: 'User deleted successfully'
  });
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ active: true });
  const adminUsers = await User.countDocuments({ role: 'super_admin' });
  const usersWithTokens = await User.countDocuments({ tokenCreationEnabled: true });

  res.json({
    stats: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      usersWithTokensEnabled: usersWithTokens
    }
  });
});

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { createError } from './errorHandler';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw createError(errorMessages, 400);
  }
  next();
};

// Auth validation rules
export const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
export const validateProject = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  handleValidationErrors
];

// Screenshot validation rules
export const validateScreenshot = [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL'),
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('type')
    .optional()
    .isIn(['normal', 'crawl', 'frame'])
    .withMessage('Type must be normal, crawl, or frame'),
  body('timeFrames')
    .optional()
    .isArray()
    .withMessage('Time frames must be an array'),
  body('timeFrames.*')
    .optional()
    .isNumeric()
    .custom((value) => {
      const num = Number(value);
      if (num < 0 || num > 300) {
        throw new Error('Each time frame must be between 0 and 300 seconds');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateCrawlScreenshot = [
  body('baseUrl')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid base URL'),
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  handleValidationErrors
];

export const validateCrawlSelection = [
  body('collectionId')
    .isMongoId()
    .withMessage('Invalid collection ID'),
  body('selectedUrls')
    .isArray({ min: 1 })
    .withMessage('At least one URL must be selected'),
  body('selectedUrls.*')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('All selected URLs must be valid'),
  handleValidationErrors
];

// User management validation rules
export const validateUserUpdate = [
  body('tokenCreationEnabled')
    .optional()
    .isBoolean()
    .withMessage('tokenCreationEnabled must be a boolean'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active must be a boolean'),
  handleValidationErrors
];

export const validateUserCreation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['super_admin', 'user'])
    .withMessage('Role must be either super_admin or user'),
  handleValidationErrors
];

// Token validation rules
export const validateTokenCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Token name must be between 1 and 100 characters'),
  handleValidationErrors
];

// Config validation rules
export const validateConfigUpdate = [
  body('value')
    .notEmpty()
    .withMessage('Config value is required'),
  handleValidationErrors
];

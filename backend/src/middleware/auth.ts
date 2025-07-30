import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ApiToken } from '../models/ApiToken';
import { logger } from '../config/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenCreationEnabled: boolean;
  active: boolean;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Check if it's an API token (starts with 'api_')
    if (token.startsWith('api_')) {
      await authenticateApiToken(req, res, next, token);
      return;
    }

    // JWT token authentication
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tokenCreationEnabled: decoded.tokenCreationEnabled,
      active: decoded.active
    };

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authenticateApiToken = async (req: Request, res: Response, next: NextFunction, token: string): Promise<void> => {
  try {
    // Remove 'api_' prefix
    const actualToken = token.substring(4);
    
    // Find the token in database
    const apiToken = await ApiToken.findOne({ active: true }).populate('userId');
    
    if (!apiToken) {
      res.status(401).json({ error: 'Invalid API token' });
      return;
    }

    // Compare the token
    const isValidToken = await apiToken.compareToken(actualToken);
    if (!isValidToken) {
      res.status(401).json({ error: 'Invalid API token' });
      return;
    }

    const user = await User.findById(apiToken.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    // Check if user is active and has token creation enabled
    if (!user.active || !user.tokenCreationEnabled) {
      res.status(401).json({ error: 'API access not enabled for this user' });
      return;
    }

    // Update last used timestamp
    apiToken.lastUsed = new Date();
    await apiToken.save();

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenCreationEnabled: user.tokenCreationEnabled,
      active: user.active
    };

    next();
  } catch (error) {
    logger.error('API token authentication error:', error);
    res.status(401).json({ error: 'Invalid API token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['super_admin']);

export const requireTokenCreationEnabled = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.tokenCreationEnabled) {
    res.status(403).json({ error: 'API token creation not enabled for this user' });
    return;
  }

  next();
};

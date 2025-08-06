import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Extend Socket interface to include user properties
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

import { connectDB } from './config/database';
import { initializeAgenda } from './config/agenda';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { createDefaultAdmin } from './utils/createDefaultAdmin';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import screenshotRoutes from './routes/screenshots';
import collectionRoutes from './routes/collections';
import tokenRoutes from './routes/tokens';
import configRoutes from './routes/configs';
import imageRoutes from './routes/images';

// Load environment variables
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '../../.env.production') });
} else {
  dotenv.config();
}

// Trigger restart

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5001',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 8002;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Next.js
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections for Socket.io
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5001',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
// Temporarily disable rate limiting for development
// app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (with authentication)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.io authentication middleware
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Verify user still exists and is active
    const { User } = require('./models/User');
    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      return next(new Error('Invalid or inactive user'));
    }

    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    
    logger.info(`Socket authenticated for user: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Invalid token'));
  }
});

// Socket.io middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/images', imageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// For all non-API routes, serve React app
app.get('*', (req, res) => {
  // Skip API routes and health check
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({ error: 'Not found' })
  }
  
  // Serve React app for all other routes (client-side routing)
  return res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Static file serving for uploads (with authentication)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket: AuthenticatedSocket) => {
  logger.info(`Client connected: ${socket.id} for user: ${socket.userEmail}`);
  
  // Automatically join user to their room using authenticated user ID
  if (socket.userId) {
    socket.join(`user-${socket.userId}`);
    logger.info(`User ${socket.userId} (${socket.userEmail}) automatically joined their room`);
  }
  
  // Keep the manual join-user-room for backward compatibility
  socket.on('join-user-room', (userId: string) => {
    // Verify the userId matches the authenticated user
    if (socket.userId && userId === socket.userId) {
      socket.join(`user-${userId}`);
      logger.info(`User ${userId} manually joined their room`);
    } else {
      logger.warn(`User ${socket.userId} tried to join room for different user ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id} for user: ${socket.userEmail}`);
  });
});

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Initialize job queue
    await initializeAgenda();
    logger.info('Agenda job queue initialized');

    // Create default admin user
    await createDefaultAdmin();
    logger.info('Default admin user checked/created');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

startServer();

// Extend Express Request type for TypeScript
declare global {
  namespace Express {
    interface Request {
      io: Server;
      user?: {
        id: string;
        email: string;
        role: string;
        tokenCreationEnabled: boolean;
        active: boolean;
      };
    }
  }
}

export { io };

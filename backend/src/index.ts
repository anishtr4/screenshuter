import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

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

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5001',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (with authentication)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.io middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/screenshots', screenshotRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/tokens', tokenRoutes);
app.use('/api/v1/configs', configRoutes);
app.use('/api/v1/images', imageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
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

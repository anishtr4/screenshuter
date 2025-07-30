# Technical Documentation 📋

> Comprehensive technical guide for Screenshot SaaS developers

## 🎯 Quick Reference

### Critical Recent Fixes
- **Collection Modal Image Stability**: Fixed blob URL premature revocation
- **Code Quality**: Removed all debug logs and test secrets
- **Production Ready**: Clean, secure codebase

### Emergency Contacts & Resources
- **Repository**: https://github.com/anishtr4/screenshuter
- **Tech Stack**: Next.js 14, Node.js, MongoDB, TypeScript
- **Key Dependencies**: Playwright, Socket.io, Agenda.js

## 🏗️ Architecture Deep Dive

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   File System   │              │
         └──────────────│   (uploads/)    │──────────────┘
                        └─────────────────┘
```

### Data Flow
1. **User Request** → Frontend UI
2. **API Call** → Backend Express server
3. **Authentication** → JWT validation
4. **Business Logic** → Controllers & Services
5. **Database Operations** → MongoDB via Mongoose
6. **File Operations** → Local filesystem
7. **Real-time Updates** → Socket.io WebSocket
8. **Job Processing** → Agenda.js queue

## 🔧 Core Components

### Frontend Architecture (`/frontend/src/`)

#### Key Files & Their Purpose
```
app/
├── projects/[id]/page.tsx     # Main project view (CRITICAL - blob URL management)
├── dashboard/                 # Dashboard pages
└── auth/                     # Authentication pages

components/
├── modals/
│   ├── CollectionFramesModal.tsx  # Collection image viewer
│   ├── AddScreenshotModal.tsx     # Screenshot creation form
│   └── FullImageModal.tsx         # Full-size image viewer
├── ui/                       # shadcn/ui components
└── layout/                   # Layout components

hooks/
├── useSocket.ts              # WebSocket connection management
├── useStableImageUrls.ts     # Blob URL caching (CRITICAL)
└── useAuth.ts               # Authentication state

lib/
├── api.ts                   # API client with authentication
└── utils.ts                 # Utility functions

store/
├── slices/authSlice.ts      # Authentication state
└── projectStore.ts          # Project-specific state

types/
└── index.ts                 # TypeScript definitions
```

#### Critical Frontend Patterns

**1. Blob URL Management (RECENTLY FIXED)**
```typescript
// ✅ CORRECT: Stable blob URL cache
const blobUrlCacheRef = useRef<Record<string, string>>({})

// ✅ CORRECT: Cleanup only on unmount
useEffect(() => {
  return () => {
    Object.values(blobUrlCacheRef.current).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }
}, []) // ⚠️ CRITICAL: Empty dependency array

// ❌ WRONG: Would cause premature cleanup
// }, [imageUrls]) // This was the bug!
```

**2. Socket Integration**
```typescript
// Real-time screenshot progress updates
const { screenshotProgress, isConnected } = useSocket()

useEffect(() => {
  Object.values(screenshotProgress).forEach(async (progress) => {
    if (progress.status === 'completed') {
      // Update UI and load new image
      await loadSingleImageUrl(progress.screenshotId)
    }
  })
}, [screenshotProgress])
```

**3. Unified Redux State Management Pattern**
```typescript
// Redux Toolkit: Unified state management with persistence
const { user, token } = useAppSelector((state) => state.auth)
const { currentProject, screenshots, collections } = useAppSelector((state) => state.project)
const dispatch = useAppDispatch()

// Authentication actions
const login = (userData, authToken, userLimits) => {
  dispatch(setAuth({ 
    user: userData, 
    token: authToken, 
    limits: userLimits 
  }))
}

// Project actions
const setProject = (project) => {
  dispatch(setCurrentProject(project))
}

const addNewScreenshot = (screenshot) => {
  dispatch(addScreenshot(screenshot))
}

// Custom hook for easier usage
const { currentProject, screenshots, setCurrentProject, addScreenshot } = useProject()
```

**Why Unified Redux?**
- **Consistency**: Single state management pattern across the entire app
- **DevTools**: Excellent debugging with Redux DevTools
- **Persistence**: Built-in state persistence with redux-persist
- **Predictability**: Clear action-based state updates
- **Time Travel**: Debug by replaying actions
- **Middleware**: Easy to add logging, analytics, etc.

### Backend Architecture (`/backend/src/`)

#### Key Files & Their Purpose
```
controllers/
├── authController.ts         # Authentication logic
├── projectController.ts      # Project CRUD operations
├── screenshotController.ts   # Screenshot creation & management
├── userController.ts         # User management (admin)
└── imageController.ts        # Secure image serving

models/
├── User.ts                  # User schema with roles
├── Project.ts               # Project schema
├── Screenshot.ts            # Screenshot metadata
├── Collection.ts            # Crawl collections
└── ApiToken.ts             # API authentication tokens

routes/
├── auth.ts                 # Authentication endpoints
├── projects.ts             # Project endpoints
├── screenshots.ts          # Screenshot endpoints
├── users.ts               # User management endpoints
└── images.ts              # Image serving endpoints

middleware/
├── auth.ts                # JWT authentication
├── validation.ts          # Request validation
└── errorHandler.ts        # Global error handling

services/
└── ScreenshotService.ts   # Playwright integration

utils/
├── checkLimits.ts         # User limit validation
└── createDefaultAdmin.ts  # Initial admin setup
```

#### Critical Backend Patterns

**1. Authentication Middleware**
```typescript
// JWT authentication for protected routes
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' })
  }
}
```

**2. Job Queue Processing**
```typescript
// Agenda.js job for async screenshot processing
agenda.define('capture-screenshot', async (job) => {
  const { screenshotId, url, options } = job.attrs.data
  
  try {
    // Update status to processing
    await Screenshot.findByIdAndUpdate(screenshotId, { status: 'processing' })
    
    // Capture screenshot with Playwright
    const result = await screenshotService.captureScreenshot(url, options)
    
    // Update with results
    await Screenshot.findByIdAndUpdate(screenshotId, {
      status: 'completed',
      imagePath: result.imagePath,
      thumbnailPath: result.thumbnailPath,
      metadata: result.metadata
    })
    
    // Emit socket event
    io.to(`user_${userId}`).emit('screenshot-progress', {
      screenshotId,
      status: 'completed',
      imagePath: result.imagePath
    })
  } catch (error) {
    // Handle failure
    await Screenshot.findByIdAndUpdate(screenshotId, {
      status: 'failed',
      error: error.message
    })
  }
})
```

**3. Secure Image Serving**
```typescript
// Authenticated image serving
export const getImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { type = 'thumbnail' } = req.query
    
    // Find screenshot and verify ownership
    const screenshot = await Screenshot.findById(id)
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' })
    }
    
    // Check user access
    const project = await Project.findById(screenshot.projectId)
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }
    
    // Serve file
    const imagePath = type === 'full' ? screenshot.imagePath : screenshot.thumbnailPath
    const fullPath = path.join(process.env.UPLOAD_DIR!, imagePath)
    
    res.sendFile(fullPath)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
```

## 🔄 Real-time Updates

### WebSocket Flow
```
1. User connects → Join user-specific room
2. Screenshot job starts → Emit 'processing' status
3. Job completes → Emit 'completed' with image paths
4. Frontend receives → Update UI and load images
5. User disconnects → Leave room and cleanup
```

### Socket Events
```typescript
// Server-side events
io.to(`user_${userId}`).emit('screenshot-progress', {
  screenshotId: string,
  status: 'processing' | 'completed' | 'failed',
  imagePath?: string,
  thumbnailPath?: string,
  metadata?: object,
  error?: string
})

// Client-side handling
socket.on('screenshot-progress', (data) => {
  // Update progress state
  setScreenshotProgress(prev => ({
    ...prev,
    [data.screenshotId]: data
  }))
})
```

## 🗄️ Database Schema

### Core Collections

**Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'super_admin',
  isActive: Boolean,
  canCreateTokens: Boolean,
  limits: {
    screenshots: Number,
    projects: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Projects Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Screenshots Collection**
```javascript
{
  _id: ObjectId,
  url: String,
  projectId: ObjectId (ref: Project),
  status: 'pending' | 'processing' | 'completed' | 'failed',
  imagePath: String,
  thumbnailPath: String,
  metadata: {
    title: String,
    description: String,
    viewport: Object,
    timing: Object
  },
  isCollectionFolder: Boolean,
  collectionInfo: {
    id: String,
    name: String,
    baseUrl: String
  },
  frames: [Screenshot], // For collections
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚨 Common Issues & Solutions

### 1. Broken Images in Collection Modal
**Symptoms**: Images show as broken/missing in collection modal
**Root Cause**: Blob URLs being revoked prematurely
**Solution**: Ensure cleanup effect has empty dependency array

```typescript
// ✅ CORRECT
useEffect(() => {
  return () => {
    // Cleanup blob URLs
  }
}, []) // Empty array!

// ❌ WRONG
useEffect(() => {
  return () => {
    // Cleanup blob URLs
  }
}, [imageUrls]) // Causes premature cleanup
```

### 2. WebSocket Connection Issues
**Symptoms**: Real-time updates not working
**Debugging Steps**:
1. Check browser DevTools → Network → WS tab
2. Verify `NEXT_PUBLIC_WS_URL` environment variable
3. Check CORS settings in backend
4. Monitor connection status in useSocket hook

### 3. Screenshot Processing Stuck
**Symptoms**: Screenshots remain in "processing" status
**Debugging Steps**:
1. Check Agenda.js jobs in MongoDB: `db.agendaJobs.find()`
2. Verify Playwright browser installation
3. Check file permissions in uploads directory
4. Review Winston logs for errors

### 4. Authentication Issues
**Symptoms**: API calls returning 401/403 errors
**Debugging Steps**:
1. Verify JWT token in localStorage
2. Check token expiration
3. Confirm user account is active
4. Review authentication middleware logs

## 🔧 Development Tools

### Useful Commands
```bash
# Backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run lint         # ESLint checking
npm run test         # Run tests

# Frontend
npm run dev          # Next.js dev server
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run lint         # ESLint checking

# Database
mongosh              # MongoDB shell
db.screenshots.find().limit(5)  # Query screenshots
db.agendaJobs.find({ name: 'capture-screenshot' })  # Check jobs
```

### Browser DevTools Tips
- **Network Tab**: Monitor API calls and WebSocket frames
- **Application Tab**: Check localStorage for JWT tokens
- **Console Tab**: View error messages and logs
- **Sources Tab**: Debug with breakpoints

### MongoDB Queries
```javascript
// Find recent screenshots
db.screenshots.find().sort({ createdAt: -1 }).limit(10)

// Check processing jobs
db.agendaJobs.find({ name: 'capture-screenshot', nextRunAt: { $exists: true } })

// Find user by email
db.users.findOne({ email: 'user@example.com' })

// Count screenshots by status
db.screenshots.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

## 📈 Performance Optimization

### Frontend Optimizations
1. **Image Loading**: Use Next.js Image component with lazy loading
2. **Bundle Size**: Analyze with `npm run analyze`
3. **Caching**: Implement proper cache headers
4. **Virtualization**: For large lists of screenshots

### Backend Optimizations
1. **Database Indexing**: Add indexes on frequently queried fields
2. **Job Queue**: Use Agenda.js for async processing
3. **Image Processing**: Generate thumbnails with Sharp
4. **Caching**: Implement Redis for session storage (future)

### Database Indexes
```javascript
// Recommended indexes
db.screenshots.createIndex({ projectId: 1, createdAt: -1 })
db.screenshots.createIndex({ status: 1 })
db.projects.createIndex({ userId: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

## 🔐 Security Checklist

### Authentication & Authorization
- [ ] JWT tokens with proper expiration
- [ ] Password hashing with bcrypt
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Input validation on all endpoints

### File Security
- [ ] Authenticated image serving
- [ ] File type validation
- [ ] Path traversal prevention
- [ ] Secure file storage outside web root
- [ ] Proper file permissions

### Environment Security
- [ ] Environment variables for secrets
- [ ] No hardcoded credentials
- [ ] HTTPS in production
- [ ] CORS properly configured
- [ ] Security headers implemented

## 🚀 Deployment Guide

### Production Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/screenshot-saas-prod
JWT_SECRET=your-super-secret-jwt-key
UPLOAD_DIR=/var/www/uploads
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=secure-admin-password

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
NEXT_PUBLIC_WS_URL=https://api.yourcompany.com
```

### Docker Production Setup
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/screenshot-saas
    volumes:
      - uploads:/app/uploads
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  mongo:
    image: mongo:5.0
    volumes:
      - mongo-data:/data/db

volumes:
  uploads:
  mongo-data:
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] File permissions set correctly
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Health checks configured

## 📞 Support & Maintenance

### Log Locations
- **Backend Logs**: Console output and Winston log files
- **Frontend Logs**: Browser console and Next.js logs
- **Database Logs**: MongoDB log files
- **System Logs**: Docker container logs

### Monitoring Endpoints
```bash
# Health check
GET /api/v1/health

# System status
GET /api/v1/status

# Database connection
GET /api/v1/db-status
```

### Backup Strategy
1. **Database**: Regular MongoDB dumps
2. **Files**: Backup uploads directory
3. **Configuration**: Version control for environment configs
4. **Code**: Git repository with tagged releases

---

*This document is maintained by the development team. Last updated: 2025-01-30*

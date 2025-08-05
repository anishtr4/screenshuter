# Screenshot SaaS - Developer Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Current Features](#current-features)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)
- [UI/UX Design System](#uiux-design-system)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Implementation](#security-implementation)
- [Testing Strategy](#testing-strategy)
- [Deployment Guide](#deployment-guide)
- [Contributing Guidelines](#contributing-guidelines)

## Overview

Screenshot SaaS is a production-ready Screenshot-as-a-Service platform built with modern technologies. The application provides comprehensive screenshot capture, management, and organization capabilities with advanced features including project management, role-based access control, API integration, and website crawling.

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with API tokens
- **Real-time**: Socket.IO for progress updates
- **Screenshot Engine**: Playwright browser automation
- **Queue System**: Agenda.js (MongoDB-based)
- **UI Components**: Custom glassmorphism design with Lucide icons
- **State Management**: Redux Toolkit with Redux Persist

## Current Features

### Core Screenshot Capabilities
- **Single Screenshots**: Capture individual webpage screenshots with customizable options
- **Frame Screenshots**: Time-based multi-frame captures at specified intervals (0-300 seconds)
- **Website Crawling**: Automatic URL discovery and batch screenshot capture
- **Auto-scroll Screenshots**: Capture long pages with automatic scrolling
- **Collection Management**: Organize related screenshots into collections
- **Real-time Progress**: Live updates via WebSocket for capture progress

### Project Management
- **Project Organization**: Group screenshots and collections by project
- **Project Dashboard**: Overview with statistics and recent activity
- **Project Settings**: Configurable project metadata and permissions
- **Bulk Operations**: Mass delete, export, and management operations

### User Management & Authentication
- **Role-based Access**: Super Admin, Admin, and User roles with granular permissions
- **JWT Authentication**: Secure token-based authentication system
- **API Token System**: Programmatic access with secure API keys
- **User Dashboard**: Account management and activity tracking
- **Admin Panel**: Comprehensive user management for administrators

### Advanced Features
- **PDF Generation**: Export screenshots and collections as PDF documents
- **ZIP Downloads**: Bulk download collections as compressed archives
- **Image Processing**: Automatic thumbnail generation and optimization
- **Queue System**: Async processing with Agenda.js job queue
- **Configuration Management**: System-wide settings and limits
- **Audit Logging**: Comprehensive activity tracking and monitoring

### UI/UX Features
- **Modern Glassmorphism Design**: Professional blue-indigo-slate theme
- **Responsive Layout**: Mobile-first design with adaptive components
- **Dark/Light Mode**: Theme switching with system preference detection
- **Real-time Notifications**: Toast notifications and progress indicators
- **Interactive Modals**: Full-screen image viewing and configuration dialogs
- **Smooth Animations**: Butter-smooth hover effects and transitions

## Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── layout/          # Layout components (DashboardLayout)
│   ├── pages/           # Page components (Dashboard, Projects, etc.)
│   ├── modals/          # Modal components (AddScreenshot, PDF Config)
│   └── ui/              # Reusable UI components (Button, GlassCard)
├── hooks/               # Custom React hooks (useSocket, useProject)
├── lib/                 # Utilities and API client
├── store/               # Redux store and slices
└── types/               # TypeScript type definitions
```

### Backend Architecture
```
src/
├── controllers/         # Request handlers (screenshot, project, user)
├── models/             # Database models (User, Project, Screenshot, Collection)
├── routes/             # API routes (REST endpoints)
├── services/           # Business logic (ScreenshotService)
├── middleware/         # Custom middleware (auth, validation, error handling)
├── utils/              # Utility functions (limits, admin creation)
├── config/             # Configuration (database, agenda, logger)
└── scripts/            # Migration and utility scripts
```

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- Git

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd screenshot-saas
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Environment Variables**

Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
NODE_ENV=development
PORT=8003
MONGODB_URI=mongodb://localhost:27017/screenshot-saas
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8003/api
VITE_WS_URL=http://localhost:8003
```

4. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Development Workflow

### Git Workflow
1. Create feature branches from `main`
2. Use conventional commit messages
3. Create pull requests for code review
4. Merge after approval and testing

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and Node.js
- **Prettier**: Code formatting
- **Naming**: camelCase for variables, PascalCase for components

### Component Development
```typescript
// Example component structure
import React from 'react'
import { ComponentProps } from '@/types'

interface MyComponentProps extends ComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  return (
    <div className={`base-styles ${className}`}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

## UI/UX Design System

### Color Palette
The application uses a professional blue-indigo-slate color system with glassmorphism effects:

```css
/* Primary Colors */
--blue-500: #3b82f6
--blue-600: #2563eb
--blue-700: #1d4ed8
--indigo-500: #6366f1
--indigo-600: #4f46e5
--indigo-700: #3730a3

/* Neutral Colors */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a
```

### Design Principles
1. **Glassmorphism**: Intense backdrop blur (20-40px) with gradient overlays
2. **Professional Gradients**: Blue to indigo gradients with subtle opacity
3. **Layered Shadows**: Multiple shadow layers for depth and elevation
4. **Smooth Animations**: Butter-smooth transitions (200-700ms) with ease-out timing
5. **Typography**: Clear hierarchy with slate colors and proper contrast
6. **Compact Layouts**: Efficient space utilization with reduced padding
7. **Hover Effects**: Dual shimmer effects and subtle transforms

### Component Patterns

**Card Component**
```tsx
<div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40">
  {/* Background Pattern */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
  
  <div className="relative p-6">
    {/* Content */}
  </div>
</div>
```

**Button Component**
```tsx
<button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold">
  Action
</button>
```

## API Documentation

### Authentication
```
http://localhost:8003/api
```

#### Authentication
```
POST   /api/auth/login        # User login
POST   /api/auth/signup       # User registration
POST   /api/auth/logout       # User logout
```

#### Projects
```
GET    /api/projects                              # Get user projects
POST   /api/projects                              # Create project
GET    /api/projects/:id                          # Get project details
PUT    /api/projects/:id                          # Update project
DELETE /api/projects/:id                          # Delete project
GET    /api/projects/:id/screenshots              # Get project screenshots
GET    /api/projects/:id/collections              # Get project collections
DELETE /api/projects/:projectId/collections/:collectionId  # Delete collection
POST   /api/projects/:id/pdf                      # Generate project PDF
```

#### Screenshots
```
POST   /api/screenshots                   # Create single screenshot
POST   /api/screenshots/crawl             # Start website crawl
POST   /api/screenshots/crawl/select      # Select URLs from crawl
GET    /api/screenshots/:id               # Get screenshot details
GET    /api/screenshots/collection/:id    # Get collection screenshots
DELETE /api/screenshots/:id               # Delete screenshot
DELETE /api/screenshots/collection/:id    # Delete collection
```

#### Collections
```
GET    /api/collections/:id/download      # Download collection as ZIP
POST   /api/collections/:id/pdf           # Generate collection PDF
```

#### Users (Admin only)
```
GET    /api/users             # Get all users
POST   /api/users             # Create user
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
GET    /api/users/stats       # Get user statistics
GET    /api/users/pending     # Get pending users
PATCH  /api/users/:id/approve # Approve user
```

#### API Tokens
```
GET    /api/tokens            # Get user tokens
POST   /api/tokens            # Create new token
DELETE /api/tokens/:id        # Delete token
```

#### Configuration
```
GET    /api/configs           # Get system configs
PUT    /api/configs           # Update configs
PATCH  /api/configs/:id       # Update specific config
```

#### Images
```
GET    /api/images/:id        # Get screenshot image
GET    /api/images/:id?type=thumbnail  # Get thumbnail
```

#### API Keys
```
GET    /api/tokens            # Get user API keys
POST   /api/tokens            # Create API key
DELETE /api/tokens/:id        # Delete API key
```

### Request/Response Examples

**Create Screenshot**
```json
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://example.com",
  "timeFrames": [0, 5, 10],
  "autoScroll": true,
  "collectionName": "Homepage Tests"
}

Response:
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6789012346",
    "url": "https://example.com",
    "status": "processing",
    "collectionId": "64a1b2c3d4e5f6789012347"
  }
}
```

## Database Schema

### User Model
```typescript
interface User {
  _id: ObjectId
  firstName: string
  lastName: string
  email: string
  password: string // hashed
  role: 'user' | 'admin' | 'super_admin'
  active: boolean
  tokenCreationEnabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Project Model
```typescript
interface Project {
  _id: ObjectId
  name: string
  description?: string
  userId: ObjectId // ref: User
  createdAt: Date
  updatedAt: Date
}
```

### Screenshot Model
```typescript
interface Screenshot {
  _id: ObjectId
  projectId: ObjectId // ref: Project
  url: string
  imagePath?: string
  thumbnailPath?: string
  type: 'normal' | 'crawl' | 'frame' | 'scroll'
  collectionId?: ObjectId // ref: Collection
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  metadata?: {
    title?: string
    width?: number
    height?: number
    fileSize?: number
    capturedAt?: Date
    frameDelay?: number
    frameIndex?: number
    totalFrames?: number
    scrollPosition?: number
    scrollIndex?: number
    isAutoScroll?: boolean
    scrollType?: string
  }
  createdAt: Date
}
```

### Collection Model
```typescript
interface Collection {
  _id: ObjectId
  name: string
  projectId: ObjectId // ref: Project
  userId: ObjectId // ref: User
  screenshots: ObjectId[] // ref: Screenshot
  createdAt: Date
  updatedAt: Date
}
```

## Security Implementation

### Authentication & Authorization
1. **JWT Tokens**: Secure token-based authentication
2. **Role-based Access**: User, Admin, Super Admin roles
3. **Route Protection**: Middleware for protected routes
4. **CORS Configuration**: Proper cross-origin setup

### Data Protection
1. **Password Hashing**: bcrypt with salt rounds
2. **Input Validation**: Joi schema validation
3. **SQL Injection Prevention**: Mongoose ODM protection
4. **XSS Prevention**: Content sanitization

### API Security
1. **Rate Limiting**: Prevent abuse
2. **Helmet.js**: Security headers
3. **HTTPS Enforcement**: Production SSL/TLS
4. **Environment Variables**: Sensitive data protection

### Recent Security Enhancements
- **API Key Deletion Confirmation**: Prevents accidental deletions
- **Admin Permission Fixes**: Proper role-based project access
- **Enhanced User Feedback**: Clear security warnings

## Testing Strategy

### Frontend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Backend Testing
```bash
# API tests
npm run test

# Integration tests
npm run test:integration
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## Deployment Guide

### Production Environment
1. **Environment Variables**: Set production values
2. **Database**: MongoDB Atlas or self-hosted
3. **File Storage**: AWS S3 or similar
4. **Process Manager**: PM2 for Node.js
5. **Reverse Proxy**: Nginx configuration
6. **SSL Certificate**: Let's Encrypt or commercial

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
# GitHub Actions example
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy
        run: # deployment commands
```

## Recent Updates

### Version 2.1.0 (Latest)
**UI/UX Overhaul - Blue Theme Implementation**

#### Major Changes:
1. **Design System Update**
   - Migrated from orange/gray theme to professional blue-indigo-slate palette
   - Implemented glass morphism design with backdrop blur effects
   - Enhanced visual hierarchy with improved typography and spacing

2. **Component Modernization**
   - Replaced deprecated GlassCard components with custom blue-themed cards
   - Updated all buttons with consistent gradient styling and animations
   - Enhanced form inputs with blue focus states and rounded corners

3. **Page-Specific Updates**
   - **Projects Page**: Removed API Key button, updated card styling
   - **API Keys Page**: Added deletion confirmation, simplified key display
   - **Configs Page**: Complete theme update with improved form layouts
   - **Users Page**: Full overhaul with modern table design and enhanced empty states
   - **Sidebar**: Increased width, replaced camera icon with thunder icon

4. **Security Enhancements**
   - Added confirmation modals for API key deletion
   - Enhanced admin permissions for project operations
   - Improved user feedback with descriptive warnings

5. **Technical Improvements**
   - Fixed JSX structure and component hierarchy
   - Enhanced accessibility with better contrast ratios
   - Improved responsive design and mobile compatibility
   - Added smooth animations and transitions throughout

#### Files Modified:
- `frontend/src/components/pages/ProjectsPage.tsx`
- `frontend/src/components/pages/ApiKeysPage.tsx`
- `frontend/src/components/pages/ConfigsPage.tsx`
- `frontend/src/components/pages/UsersPage.tsx`
- `frontend/src/components/layout/DashboardLayout.tsx`
- `backend/src/controllers/projectController.ts`

### Previous Versions
- **v2.0.0**: Collection management and auto-scroll features
- **v1.5.0**: Real-time progress tracking with Socket.IO
- **v1.0.0**: Initial release with basic screenshot functionality

## Contributing Guidelines

### Code Review Process
1. **Feature Branches**: Create from `main`
2. **Pull Requests**: Detailed description and screenshots
3. **Code Review**: At least one approval required
4. **Testing**: All tests must pass
5. **Documentation**: Update relevant docs

### Commit Message Format
```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### Development Best Practices
1. **Component Reusability**: Create reusable components
2. **Type Safety**: Use TypeScript strictly
3. **Performance**: Optimize renders and API calls
4. **Accessibility**: Follow WCAG guidelines
5. **Mobile First**: Responsive design approach

### Issue Reporting
When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Screenshots if applicable
- Error messages/logs

### Feature Requests
For new features, provide:
- Use case description
- Proposed solution
- Alternative approaches
- Impact assessment

## Support & Resources

### Documentation
- [API Reference](./API.md)
- [Component Library](./COMPONENTS.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Development Tools
- **VS Code Extensions**: TypeScript, Tailwind CSS, ESLint
- **Browser DevTools**: React Developer Tools
- **Database Tools**: MongoDB Compass
- **API Testing**: Postman/Insomnia

### Community
- **Issues**: GitHub Issues for bugs and features
- **Discussions**: GitHub Discussions for questions
- **Wiki**: Project wiki for additional documentation

---

*Last Updated: January 2025*
*Version: 2.1.0*

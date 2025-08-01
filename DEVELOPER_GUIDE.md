# Screenshot SaaS - Developer Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)
- [UI/UX Design System](#uiux-design-system)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Implementation](#security-implementation)
- [Testing Strategy](#testing-strategy)
- [Deployment Guide](#deployment-guide)
- [Recent Updates](#recent-updates)
- [Contributing Guidelines](#contributing-guidelines)

## Overview

Screenshot SaaS is a modern web application built for automated screenshot capture and management. The application provides a comprehensive platform for users to create projects, capture screenshots with various configurations, manage collections, and handle user permissions.

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Real-time**: Socket.IO for progress updates
- **Screenshot Engine**: Puppeteer
- **UI Components**: Custom components with glass morphism design

## Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── layout/          # Layout components (DashboardLayout, etc.)
│   ├── pages/           # Page components
│   ├── modals/          # Modal components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API client
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

### Backend Architecture
```
src/
├── controllers/         # Request handlers
├── models/             # Database models
├── routes/             # API routes
├── services/           # Business logic
├── middleware/         # Custom middleware
├── utils/              # Utility functions
└── types/              # TypeScript interfaces
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
PORT=5000
MONGODB_URI=mongodb://localhost:27017/screenshot-saas
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
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
The application uses a professional blue-indigo-slate color system:

```css
/* Primary Colors */
--blue-500: #3b82f6
--blue-600: #2563eb
--indigo-500: #6366f1
--indigo-600: #4f46e5

/* Neutral Colors */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-600: #475569
--slate-900: #0f172a
```

### Design Principles
1. **Glass Morphism**: Backdrop blur effects with transparency
2. **Gradients**: Blue to indigo gradients for primary elements
3. **Shadows**: Layered shadows for depth
4. **Animations**: Smooth transitions (300ms duration)
5. **Typography**: Clear hierarchy with slate colors

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
All API endpoints require JWT authentication except for login/register.

**Headers**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Core Endpoints

#### Projects
```
GET    /api/projects          # Get user projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
```

#### Screenshots
```
GET    /api/screenshots/:projectId    # Get project screenshots
POST   /api/screenshots               # Create screenshot
DELETE /api/screenshots/:id          # Delete screenshot
```

#### Users (Admin only)
```
GET    /api/users             # Get all users
POST   /api/users             # Create user
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
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
  userId: ObjectId // ref: User
  url: string
  imagePath: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  collectionId?: ObjectId // ref: Collection
  timeFrame?: number
  createdAt: Date
  updatedAt: Date
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

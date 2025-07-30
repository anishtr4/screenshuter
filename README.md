# Screenshot SaaS 📸

> A production-ready Screenshot-as-a-Service platform built with modern technologies

Capture, manage, and organize website screenshots with powerful features including project management, role-based access control, API integration, and website crawling capabilities.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## 🎯 Recent Updates & Fixes

### ✅ Collection Modal Image Stability (Latest Fix)
- **Fixed**: Blob URL premature revocation causing broken images in collection modals
- **Solution**: Implemented stable blob URL cache with proper lifecycle management
- **Impact**: Collection modal images now remain stable across real-time socket updates
- **Technical**: Changed cleanup effect dependency from `[imageUrls]` to `[]` to prevent premature cleanup

### 🧹 Code Quality Improvements
- **Removed**: All debug console.log statements from production code
- **Security**: Removed hardcoded test API keys and secrets
- **Clean**: Production-ready codebase with proper error handling

## 🚀 Features

### Core Features
- **High-Quality Screenshots**: Capture pixel-perfect screenshots using Playwright browser automation
- **Website Crawling**: Automatically discover and capture screenshots from multiple pages
- **Project Management**: Organize screenshots into projects with intuitive management
- **Role-Based Access Control**: Super Admin and User roles with granular permissions
- **API Integration**: RESTful API with token-based authentication for programmatic access
- **Real-time Updates**: Live status updates via WebSocket connections

### User Management
- **Admin Dashboard**: Comprehensive user management for administrators
- **Account Control**: Enable/disable user accounts and API token creation
- **Free Tier Limits**: Configurable limits for screenshots and projects
- **Secure Authentication**: JWT-based authentication with secure token handling

### Technical Features
- **Queue-based Processing**: Async screenshot capture with Agenda.js job queue
- **Secure File Serving**: Authenticated image serving with access control
- **Responsive Design**: Modern, mobile-first UI with dark/light mode support
- **TypeScript**: Full type safety across frontend and backend
- **Production Ready**: Comprehensive error handling, logging, and monitoring

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Screenshot Engine**: Playwright for browser automation
- **Queue System**: Agenda.js (MongoDB-based, no Redis required)
- **Authentication**: JWT with manual implementation
- **Real-time**: Socket.io for WebSocket connections
- **Logging**: Winston for structured logging
- **Image Processing**: Sharp for thumbnail generation

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: Redux Toolkit with Redux Persist
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Theme**: next-themes for dark/light mode

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **File Storage**: Local filesystem with authenticated serving
- **Environment**: Environment-based configuration
- **Development**: Hot reload and TypeScript compilation

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Docker and Docker Compose (optional)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd screenshot-saas
\`\`\`

### 2. Environment Setup

#### Backend Configuration
\`\`\`bash
cd backend
cp .env.example .env
# Edit .env with your configuration
\`\`\`

Key environment variables:
- \`MONGODB_URI\`: MongoDB connection string
- \`JWT_SECRET\`: Secret key for JWT tokens
- \`ADMIN_EMAIL\`: Default admin user email
- \`ADMIN_PASSWORD\`: Default admin user password

#### Frontend Configuration
\`\`\`bash
cd frontend
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local
\`\`\`

### 3. Installation & Setup

#### Using Docker Compose (Recommended)
\`\`\`bash
docker-compose up -d
\`\`\`

#### Manual Setup
\`\`\`bash
# Install backend dependencies
cd backend
npm install
npm run build

# Install frontend dependencies
cd ../frontend
npm install
npm run build

# Start MongoDB (ensure it's running)
# Start backend
cd ../backend
npm start

# Start frontend (in another terminal)
cd ../frontend
npm start
\`\`\`

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Default Admin**: admin@screenshot-saas.com / admin123

## 📖 Usage

### Getting Started
1. **Sign Up**: Create a new account or use the default admin credentials
2. **Create Project**: Organize your screenshots into projects
3. **Capture Screenshots**: 
   - **Normal Mode**: Enter a single URL to capture
   - **Crawl Mode**: Enter a base URL to discover and capture multiple pages
4. **Manage Screenshots**: View, organize, and download your captured screenshots

### API Usage
1. **Enable API Access**: Admin must enable token creation for your account
2. **Generate Token**: Create an API token in your dashboard
3. **Make Requests**: Use the token to make programmatic screenshot requests

\`\`\`bash
curl -X POST http://localhost:3001/api/v1/screenshots \\
  -H "Authorization: Bearer api_your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "projectId": "project-id"}'
\`\`\`

### Admin Features
- **User Management**: Create, enable/disable users
- **Token Control**: Enable/disable API token creation per user
- **System Configuration**: Adjust free tier limits and system settings
- **Usage Monitoring**: View system statistics and user activity

## 🏗 Architecture

### System Design
- **Monorepo Structure**: Single repository with backend and frontend
- **Microservices Ready**: Modular design for easy scaling
- **Queue-based Processing**: Async job processing for screenshot capture
- **Secure by Default**: Authentication required for all operations

### Database Schema
- **Users**: Authentication and role management
- **Projects**: Screenshot organization
- **Screenshots**: Metadata and file references
- **Collections**: Crawl result groupings
- **API Tokens**: Secure API access
- **Configs**: System configuration

### API Design
- **RESTful**: Standard HTTP methods and status codes
- **Versioned**: API versioning for backward compatibility
- **Documented**: OpenAPI/Swagger documentation
- **Secure**: JWT and API token authentication

## 🔧 Development

### Backend Development
\`\`\`bash
cd backend
npm run dev  # Start with hot reload
npm run lint # Run ESLint
npm test     # Run tests
\`\`\`

### Frontend Development
\`\`\`bash
cd frontend
npm run dev        # Start development server
npm run lint       # Run ESLint
npm run type-check # TypeScript checking
\`\`\`

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (via ESLint)
- **Husky**: Git hooks for quality checks

## 🚢 Deployment

### Docker Deployment
\`\`\`bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Manual Deployment
1. **Build Applications**:
   \`\`\`bash
   cd backend && npm run build
   cd ../frontend && npm run build
   \`\`\`

2. **Set Environment Variables**: Configure production environment
3. **Start Services**: Run built applications with process manager
4. **Setup Reverse Proxy**: Configure nginx or similar for routing

### Environment Variables

#### Backend
- \`NODE_ENV\`: Environment (development/production)
- \`PORT\`: Server port (default: 3001)
- \`MONGODB_URI\`: MongoDB connection string
- \`JWT_SECRET\`: JWT signing secret
- \`UPLOAD_DIR\`: File upload directory

#### Frontend
- \`NEXT_PUBLIC_API_URL\`: Backend API URL
- \`NEXT_PUBLIC_WS_URL\`: WebSocket server URL

## 📚 API Documentation

### Authentication
- \`POST /api/v1/auth/login\`: User login
- \`POST /api/v1/auth/signup\`: User registration
- \`GET /api/v1/auth/profile\`: Get user profile

### Projects
- \`GET /api/v1/projects\`: List user projects
- \`POST /api/v1/projects\`: Create new project
- \`GET /api/v1/projects/:id\`: Get project details
- \`PUT /api/v1/projects/:id\`: Update project
- \`DELETE /api/v1/projects/:id\`: Delete project

### Screenshots
- \`POST /api/v1/screenshots\`: Create screenshot
- \`POST /api/v1/screenshots/crawl\`: Start crawl
- \`POST /api/v1/screenshots/crawl/select\`: Select crawl URLs
- \`GET /api/v1/screenshots/:id\`: Get screenshot details
- \`DELETE /api/v1/screenshots/:id\`: Delete screenshot

### Admin (Super Admin only)
- \`GET /api/v1/users\`: List all users
- \`POST /api/v1/users\`: Create user
- \`PATCH /api/v1/users/:id\`: Update user
- \`GET /api/v1/configs\`: Get system configuration
- \`PATCH /api/v1/configs/:id\`: Update configuration

## 👥 Developer Onboarding & Knowledge Transfer

### 🎯 For New Developers

Welcome to the Screenshot SaaS project! This section will help you understand the codebase and get productive quickly.

#### 🏗️ Project Structure
```
screenshot-saas/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Route handlers and business logic
│   │   ├── models/         # MongoDB/Mongoose schemas
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Authentication, validation, error handling
│   │   ├── services/       # Business logic and external integrations
│   │   └── utils/          # Helper functions and utilities
│   ├── uploads/            # File storage directory
│   └── package.json
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/           # Next.js 14 App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries and API client
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── docker-compose.yml      # Development environment
└── README.md              # This file
```

#### 🔧 Key Technologies & Patterns

**Backend Architecture:**
- **Express.js**: RESTful API with middleware pattern
- **Mongoose**: MongoDB ODM with schema validation
- **Agenda.js**: Job queue for async screenshot processing
- **Playwright**: Browser automation for screenshot capture
- **Socket.io**: Real-time updates for screenshot progress
- **JWT**: Stateless authentication
- **Winston**: Structured logging

**Frontend Architecture:**
- **Next.js 14**: App Router with server/client components
- **shadcn/ui**: Component library built on Radix UI
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Tailwind CSS**: Utility-first styling

#### 🚨 Critical Code Areas (Recently Fixed)

**1. Blob URL Management (`/frontend/src/app/projects/[id]/page.tsx`)**
```typescript
// CRITICAL: Blob URLs are cached in useRef to prevent premature revocation
const blobUrlCacheRef = useRef<Record<string, string>>({})

// Cleanup effect runs ONLY on unmount, not on every state change
useEffect(() => {
  return () => {
    Object.values(blobUrlCacheRef.current).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }
}, []) // Empty dependency array is crucial!
```

**2. Socket Updates & Image Loading**
- Socket updates trigger selective image reloading
- Collection frame images are loaded once during initial load
- Single screenshot images are reloaded on completion
- Modal uses parent's stable `imageUrls` state for consistency

**3. Real-time Updates (`/frontend/src/hooks/useSocket.ts`)**
```typescript
// WebSocket connection manages screenshot progress
// Automatically reconnects and handles user-specific rooms
socket.on('screenshot-progress', (data: ScreenshotProgress) => {
  setScreenshotProgress(prev => ({
    ...prev,
    [data.screenshotId]: data
  }))
})
```

#### 🛠️ Development Workflow

**1. Setting Up Development Environment:**
```bash
# Clone and setup
git clone <repo-url>
cd screenshot-saas

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local
npm install
npm run dev
```

**2. Common Development Tasks:**

*Adding a New API Endpoint:*
1. Create controller in `/backend/src/controllers/`
2. Add route in `/backend/src/routes/`
3. Add TypeScript types in `/frontend/src/types/`
4. Update API client in `/frontend/src/lib/api.ts`

*Adding a New UI Component:*
1. Create component in `/frontend/src/components/`
2. Follow shadcn/ui patterns for consistency
3. Add to Storybook if complex
4. Export from appropriate index file

*Database Schema Changes:*
1. Update Mongoose model in `/backend/src/models/`
2. Create migration script if needed
3. Update TypeScript interfaces
4. Test with existing data

#### 🔍 Debugging & Troubleshooting

**Common Issues:**

1. **Broken Images in Collection Modal**
   - Check blob URL cache in browser DevTools
   - Verify cleanup effect dependency array is empty
   - Ensure `imageUrls` state is passed correctly to modal

2. **WebSocket Connection Issues**
   - Check CORS settings in backend
   - Verify `NEXT_PUBLIC_WS_URL` environment variable
   - Monitor connection status in useSocket hook

3. **Screenshot Processing Stuck**
   - Check Agenda.js job queue in MongoDB
   - Verify Playwright browser installation
   - Check file permissions in uploads directory

**Debugging Tools:**
- **Backend**: Winston logs in console and files
- **Frontend**: React DevTools, Redux DevTools (Zustand)
- **Database**: MongoDB Compass for data inspection
- **Network**: Browser DevTools Network tab
- **WebSocket**: Browser DevTools WebSocket frames

#### 📊 Performance Considerations

**Frontend Optimizations:**
- Image lazy loading with Next.js Image component
- Blob URL caching to prevent unnecessary fetches
- Virtualization for large screenshot lists
- Debounced search and filtering

**Backend Optimizations:**
- Agenda.js job queue for async processing
- MongoDB indexing on frequently queried fields
- Image thumbnail generation with Sharp
- Authenticated file serving with proper caching headers

#### 🔐 Security Best Practices

**Authentication & Authorization:**
- JWT tokens with proper expiration
- Role-based access control (RBAC)
- API rate limiting
- Input validation with Joi/Zod

**File Security:**
- Authenticated image serving
- File type validation
- Path traversal prevention
- Secure file storage outside web root

#### 🧪 Testing Strategy

**Backend Testing:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Frontend Testing:**
```bash
cd frontend
npm test              # Jest + React Testing Library
npm run test:e2e      # Playwright E2E tests
npm run test:visual   # Visual regression tests
```

**Test Categories:**
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Visual Tests**: UI component snapshots

#### 📈 Monitoring & Observability

**Production Monitoring:**
- Winston structured logging
- Error tracking with proper error boundaries
- Performance monitoring with Web Vitals
- Database query performance monitoring

**Development Monitoring:**
- Hot reload for rapid development
- TypeScript strict mode for type safety
- ESLint for code quality
- Prettier for consistent formatting

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: \`git checkout -b feature/amazing-feature\`
3. **Commit Changes**: \`git commit -m 'Add amazing feature'\`
4. **Push to Branch**: \`git push origin feature/amazing-feature\`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure all checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Playwright**: Browser automation framework
- **Next.js**: React framework for production
- **shadcn/ui**: Beautiful and accessible UI components
- **MongoDB**: Document database
- **Express.js**: Web framework for Node.js

## 📞 Support

For support, email support@screenshot-saas.com or create an issue in the repository.

---

**Built with ❤️ using open-source technologies**

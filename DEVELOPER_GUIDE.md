# Screenshot SaaS - Developer Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Current Features](#current-features)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)
- [UI/UX Design System](#uiux-design-system)
- [API Documentation](#api-documentation)
- [Form Automation API](#form-automation-api)
- [Database Schema](#database-schema)
- [Security Implementation](#security-implementation)
- [Testing Strategy](#testing-strategy)
- [Deployment Guide](#deployment-guide)
- [Contributing Guidelines](#contributing-guidelines)
- [Adding New Fields Guide](#adding-new-fields-guide)

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
- **Smooth Animations**: Buttery transitions and hover effects
- **Professional Styling**: Business-appropriate design with subtle gradients

### Screenshot Quality & Privacy Features
- **High-Resolution Screenshots**: Configurable device scale factor (1x, 2x, 3x) for crisp images
- **Cookie Prevention**: Automatic blocking of cookie consent popups and tracking scripts
- **Privacy Protection**: Disables cookies, localStorage, sessionStorage, and indexedDB during capture
- **Clean Screenshots**: CSS injection to hide common cookie banners and consent modals
- **Consistent Capture**: Reduced motion settings for stable screenshot results

### Authentication & Access Features
- **HTTP Basic Authentication**: Support for username/password protected websites
- **Custom Cookie Injection**: Inject session cookies and authentication tokens from JSON
- **Protected Content Access**: Capture screenshots of authenticated pages and private content

### Form Automation Features
- **Multi-Step Form Automation**: Automate complex form filling workflows with multiple steps
- **Dynamic Input Support**: Handle text, select, checkbox, radio, and textarea input types
- **Form Submission Triggers**: Automatic form submission with configurable wait times
- **Validation Checks**: Verify form submission success with element existence, text content, CSS class, and attribute checks
- **Screenshot Capture Points**: Take screenshots after form filling, submission, and validation
- **Step-by-Step Progress**: Real-time progress updates for each form automation step
- **Error Resilience**: Continue screenshot capture even if form automation fails
- **Timeout Configuration**: Configurable timeouts for each form step to handle slow-loading forms
- **Flexible Authentication**: Works with all screenshot types (single, frame, crawl)

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

# Screenshot Configuration
DEVICE_SCALE_FACTOR=2
COOKIE_PREVENTION_ENABLED=true
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

### Authentication & Cookie Options

All screenshot endpoints now support additional authentication and cookie injection options:

```javascript
// HTTP Basic Authentication Example
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://protected-site.com",
  "basicAuth": {
    "username": "admin",
    "password": "secret123"
  },
  "cookiePrevention": true,
  "deviceScaleFactor": 2
}

// Custom Cookie Injection Example
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://authenticated-app.com",
  "customCookies": [
    {
      "name": "session_token",
      "value": "abc123xyz789",
      "domain": "authenticated-app.com",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "sameSite": "Lax"
    },
    {
      "name": "user_id",
      "value": "12345",
      "expires": 1735689600
    }
  ]
}

// Combined Authentication Example
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://complex-auth-site.com",
  "basicAuth": {
    "username": "api_user",
    "password": "api_pass"
  },
  "customCookies": [
    {
      "name": "csrf_token",
      "value": "csrf_abc123"
    }
  ],
  "customCSS": ".banner { display: none !important; }",
  "customJS": "document.querySelector('.popup').remove();"
}
```

#### Authentication Options Reference

**basicAuth** (optional)
- `username` (string): HTTP Basic Auth username
- `password` (string): HTTP Basic Auth password

**customCookies** (optional array)
- `name` (string, required): Cookie name
- `value` (string, required): Cookie value
- `domain` (string, optional): Cookie domain (defaults to current page domain)
- `path` (string, optional): Cookie path (defaults to "/")
- `expires` (number, optional): Unix timestamp for cookie expiration
- `httpOnly` (boolean, optional): HTTP-only flag (defaults to false)
- `secure` (boolean, optional): Secure flag (defaults to false)
- `sameSite` (string, optional): SameSite policy - "Strict", "Lax", or "None" (defaults to "Lax")

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

## Form Automation API

### Overview

Form Automation allows you to automate complex multi-step form filling workflows during screenshot capture. This feature is particularly useful for:

- Capturing screenshots of pages behind login forms
- Automating multi-step checkout processes
- Filling out complex registration or application forms
- Testing form workflows with screenshot validation
- Capturing different states of dynamic forms

### Form Automation Structure

Form automation is configured through the `formSteps` parameter in screenshot requests:

```typescript
interface FormStep {
  stepName: string                    // Descriptive name for the step
  formInputs: FormInput[]            // Array of form inputs to fill
  submitTrigger?: SubmitTrigger      // Optional form submission trigger
  validationChecks?: ValidationCheck[] // Optional validation after submission
  stepTimeout: number                // Timeout in milliseconds (default: 5000)
  takeScreenshotAfterFill: boolean   // Take screenshot after filling inputs
  takeScreenshotAfterSubmit: boolean // Take screenshot after form submission
  takeScreenshotAfterValidation: boolean // Take screenshot after validation
}

interface FormInput {
  selector: string    // CSS selector for the input element
  value: string      // Value to enter/select
  inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea'
}

interface SubmitTrigger {
  selector: string    // CSS selector for submit button/element
  waitAfter: number  // Wait time after submission (milliseconds)
}

interface ValidationCheck {
  selector: string        // CSS selector for validation element
  expectedText?: string   // Expected text content (for 'text' checkType)
  checkType: 'exists' | 'text' | 'class' | 'attribute'
  expectedClass?: string  // Expected CSS class (for 'class' checkType)
  attribute?: string      // Attribute name (for 'attribute' checkType)
  expectedValue?: string  // Expected attribute value (for 'attribute' checkType)
}
```

### API Examples

#### Basic Login Form Example

```javascript
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://example.com/login",
  "formSteps": [
    {
      "stepName": "Login Form",
      "formInputs": [
        {
          "selector": "#username",
          "value": "testuser@example.com",
          "inputType": "text"
        },
        {
          "selector": "#password",
          "value": "secretpassword",
          "inputType": "text"
        }
      ],
      "submitTrigger": {
        "selector": "#login-button",
        "waitAfter": 3000
      },
      "validationChecks": [
        {
          "selector": ".dashboard-header",
          "checkType": "exists"
        }
      ],
      "stepTimeout": 10000,
      "takeScreenshotAfterFill": true,
      "takeScreenshotAfterSubmit": true,
      "takeScreenshotAfterValidation": false
    }
  ]
}
```

#### Multi-Step Registration Form Example

```javascript
POST /api/screenshots
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://example.com/register",
  "formSteps": [
    {
      "stepName": "Personal Information",
      "formInputs": [
        {
          "selector": "input[name='firstName']",
          "value": "John",
          "inputType": "text"
        },
        {
          "selector": "input[name='lastName']",
          "value": "Doe",
          "inputType": "text"
        },
        {
          "selector": "select[name='country']",
          "value": "US",
          "inputType": "select"
        },
        {
          "selector": "input[name='newsletter']",
          "value": "true",
          "inputType": "checkbox"
        }
      ],
      "submitTrigger": {
        "selector": "button[type='submit']",
        "waitAfter": 2000
      },
      "stepTimeout": 8000,
      "takeScreenshotAfterFill": true,
      "takeScreenshotAfterSubmit": true,
      "takeScreenshotAfterValidation": false
    },
    {
      "stepName": "Account Details",
      "formInputs": [
        {
          "selector": "input[name='email']",
          "value": "john.doe@example.com",
          "inputType": "text"
        },
        {
          "selector": "input[name='password']",
          "value": "SecurePass123!",
          "inputType": "text"
        },
        {
          "selector": "input[name='confirmPassword']",
          "value": "SecurePass123!",
          "inputType": "text"
        }
      ],
      "submitTrigger": {
        "selector": ".submit-registration",
        "waitAfter": 5000
      },
      "validationChecks": [
        {
          "selector": ".success-message",
          "expectedText": "Registration successful",
          "checkType": "text"
        },
        {
          "selector": ".user-dashboard",
          "checkType": "exists"
        }
      ],
      "stepTimeout": 15000,
      "takeScreenshotAfterFill": false,
      "takeScreenshotAfterSubmit": true,
      "takeScreenshotAfterValidation": true
    }
  ]
}
```

### Input Types

#### Text Input (`text`)
```javascript
{
  "selector": "#email",
  "value": "user@example.com",
  "inputType": "text"
}
```

#### Select Dropdown (`select`)
```javascript
{
  "selector": "select[name='country']",
  "value": "US",  // Option value, not display text
  "inputType": "select"
}
```

#### Checkbox (`checkbox`)
```javascript
{
  "selector": "input[name='terms']",
  "value": "true",  // "true" to check, "false" to uncheck
  "inputType": "checkbox"
}
```

#### Radio Button (`radio`)
```javascript
{
  "selector": "input[name='gender'][value='male']",
  "value": "true",  // "true" to select this radio option
  "inputType": "radio"
}
```

#### Textarea (`textarea`)
```javascript
{
  "selector": "textarea[name='comments']",
  "value": "This is a multi-line\ncomment with line breaks.",
  "inputType": "textarea"
}
```

### Validation Check Types

#### Element Exists (`exists`)
Checks if an element exists on the page:
```javascript
{
  "selector": ".success-banner",
  "checkType": "exists"
}
```

#### Text Content (`text`)
Checks if an element contains specific text:
```javascript
{
  "selector": ".status-message",
  "expectedText": "Form submitted successfully",
  "checkType": "text"
}
```

#### CSS Class (`class`)
Checks if an element has a specific CSS class:
```javascript
{
  "selector": ".form-container",
  "expectedClass": "success-state",
  "checkType": "class"
}
```

#### Attribute Value (`attribute`)
Checks if an element has a specific attribute value:
```javascript
{
  "selector": "#submit-button",
  "attribute": "disabled",
  "expectedValue": "false",
  "checkType": "attribute"
}
```

### Frontend Implementation

#### Form Automation UI

The Form Automation section is implemented as a collapsible section in the `AddScreenshotModal` component:

```tsx
{/* Form Automation Section */}
{formData.mode === 'normal' && (
  <div className="space-y-4">
    <button
      type="button"
      onClick={() => setShowFormAutomation(!showFormAutomation)}
      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      <FileText className="h-4 w-4" />
      Form Automation
      {showFormAutomation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    
    {showFormAutomation && (
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        {/* Form automation controls */}
      </div>
    )}
  </div>
)}
```

#### Form Data Structure

```typescript
interface ScreenshotFormData {
  // ... other fields
  formSteps?: Array<{
    stepName: string
    formInputs: Array<{
      selector: string
      value: string
      inputType: string
    }>
    submitTrigger?: {
      selector: string
      waitAfter: number
    }
    validationChecks?: Array<{
      selector: string
      expectedText?: string
      checkType: string
    }>
    stepTimeout: number
    takeScreenshotAfterFill: boolean
    takeScreenshotAfterSubmit: boolean
    takeScreenshotAfterValidation: boolean
  }>
}
```

### Backend Implementation

#### Service Method

The form automation is handled by the `executeFormAutomation` method in `ScreenshotService`:

```typescript
private async executeFormAutomation(
  page: Page, 
  formSteps: FormStep[],
  screenshotDir: string,
  userId: string,
  screenshotId: string
): Promise<string[]> {
  const screenshots: string[] = []
  
  for (const [stepIndex, step] of formSteps.entries()) {
    try {
      // Set timeout for this step
      page.setDefaultTimeout(step.stepTimeout)
      
      // Fill form inputs
      for (const input of step.formInputs) {
        await this.fillFormInput(page, input)
      }
      
      // Take screenshot after filling if requested
      if (step.takeScreenshotAfterFill) {
        const screenshot = await this.captureStepScreenshot(
          page, screenshotDir, `step-${stepIndex + 1}-filled`
        )
        screenshots.push(screenshot)
      }
      
      // Submit form if trigger is provided
      if (step.submitTrigger) {
        await page.click(step.submitTrigger.selector)
        await page.waitForTimeout(step.submitTrigger.waitAfter)
        
        if (step.takeScreenshotAfterSubmit) {
          const screenshot = await this.captureStepScreenshot(
            page, screenshotDir, `step-${stepIndex + 1}-submitted`
          )
          screenshots.push(screenshot)
        }
      }
      
      // Perform validation checks
      if (step.validationChecks) {
        await this.performValidationChecks(page, step.validationChecks)
        
        if (step.takeScreenshotAfterValidation) {
          const screenshot = await this.captureStepScreenshot(
            page, screenshotDir, `step-${stepIndex + 1}-validated`
          )
          screenshots.push(screenshot)
        }
      }
      
    } catch (error) {
      console.error(`Form automation step ${stepIndex + 1} failed:`, error)
      // Continue with next step or main screenshot
    }
  }
  
  return screenshots
}
```

### Error Handling

Form automation includes robust error handling:

1. **Step-level Error Isolation**: If one step fails, subsequent steps and main screenshot capture continue
2. **Timeout Management**: Each step has configurable timeout to prevent hanging
3. **Selector Validation**: Invalid selectors are logged but don't stop the process
4. **Progress Updates**: Real-time progress updates via WebSocket even during errors
5. **Detailed Logging**: Comprehensive error logging for debugging

### Best Practices

#### Selector Strategy
- Use stable selectors (IDs, data attributes) over fragile ones (classes, positions)
- Test selectors in browser dev tools before using
- Use specific selectors to avoid ambiguity

```javascript
// Good selectors
"#email-input"                    // ID selector
"[data-testid='password-field']"  // Data attribute
"input[name='username']"          // Name attribute

// Avoid fragile selectors
".form-input:nth-child(2)"        // Position-based
".btn.btn-primary.submit"         // Multiple classes
```

#### Timing Configuration
- Set appropriate timeouts for slow-loading forms
- Use longer wait times after submission for processing
- Consider network latency in timeout values

```javascript
{
  "stepTimeout": 10000,      // 10 seconds for step completion
  "submitTrigger": {
    "selector": "#submit",
    "waitAfter": 5000        // 5 seconds after submission
  }
}
```

#### Screenshot Strategy
- Take screenshots at key points to capture form states
- Use descriptive step names for easy identification
- Balance screenshot frequency with performance

### Troubleshooting

#### Common Issues

1. **Element Not Found**: Check selector accuracy and timing
2. **Form Not Submitting**: Verify submit trigger selector and wait time
3. **Validation Failing**: Ensure validation elements appear after submission
4. **Timeout Errors**: Increase step timeout for slow forms

#### Debug Tips

1. **Test Selectors**: Use browser dev tools to test CSS selectors
2. **Check Network**: Monitor network requests during form submission
3. **Review Logs**: Check backend logs for detailed error information
4. **Progressive Testing**: Start with simple forms and add complexity

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

## Security Considerations

### Authentication Features Security

#### HTTP Basic Authentication
- **Credential Handling**: Basic Auth credentials are Base64 encoded (not encrypted)
- **HTTPS Required**: Always use HTTPS when sending Basic Auth credentials
- **Storage**: Credentials are not stored; they're only used during screenshot capture
- **Scope**: Authentication applies only to the specific screenshot request

#### Custom Cookie Injection
- **Input Validation**: Cookie values should be validated on the frontend
- **Sensitive Data**: Be cautious when injecting session tokens or authentication cookies
- **Domain Restrictions**: Cookies are automatically scoped to the target domain
- **Expiration**: Set appropriate expiration times for temporary cookies

#### Best Practices
1. **Environment Separation**: Use different credentials for development/production
2. **Credential Rotation**: Regularly rotate authentication credentials
3. **Access Logging**: Monitor authentication attempts and failures
4. **Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Input Sanitization**: Sanitize custom CSS/JS inputs to prevent injection attacks

## Adding New Fields Guide

This comprehensive guide explains how to add new fields to the Screenshot SaaS application, covering both frontend and backend implementation.

### Overview

When adding new fields to the screenshot configuration, you need to update:
1. **Backend**: Data interfaces, controllers, services, and job handlers
2. **Frontend**: Form interfaces, UI components, and API client
3. **Documentation**: Update API docs and user guides

### Backend Implementation

#### Step 1: Update Data Interfaces

**File**: `backend/src/services/ScreenshotService.ts`

Update the relevant interfaces to include your new field:

```typescript
// Add to ScreenshotJobData interface
export interface ScreenshotJobData {
  // ... existing fields
  newField?: YourFieldType; // Add your new field here
}

// Add to method parameter interfaces
interface CaptureScreenshotParams {
  // ... existing fields
  newField?: YourFieldType;
}
```

#### Step 2: Update Controllers

**File**: `backend/src/controllers/screenshotController.ts`

Extract the new field from request bodies:

```typescript
export const createScreenshot = async (req: Request, res: Response) => {
  try {
    const { 
      url, 
      projectId, 
      // ... existing fields
      newField // Add your new field here
    } = req.body;

    // Pass to job scheduling
    await agenda.now('capture-screenshot', {
      // ... existing fields
      newField, // Include in job data
    });
  } catch (error) {
    // ... error handling
  }
};
```

#### Step 3: Update Job Handlers

**File**: `backend/src/config/agenda.ts`

Update job handlers to extract and pass the new field:

```typescript
agenda.define('capture-screenshot', async (job) => {
  try {
    const { 
      screenshotId, 
      url, 
      projectId,
      // ... existing fields
      newField // Extract from job data
    } = job.attrs.data;

    // Pass to service method
    await screenshotService.captureScreenshot(screenshotId, url, projectId, {
      // ... existing options
      newField, // Include in options
    });
  } catch (error) {
    // ... error handling
  }
});
```

#### Step 4: Update Service Methods

**File**: `backend/src/services/ScreenshotService.ts`

Update service methods to handle the new field:

```typescript
public async captureScreenshot(
  screenshotId: string,
  url: string,
  projectId: string,
  options?: {
    // ... existing options
    newField?: YourFieldType;
  }
): Promise<void> {
  // Extract the new field
  const { newField } = options || {};
  
  // Use in page configuration
  await this.configurePageForScreenshot(page, {
    // ... existing options
    newField,
  });
}

private async configurePageForScreenshot(page: Page, options?: {
  // ... existing options
  newField?: YourFieldType;
}): Promise<void> {
  const { newField } = options || {};
  
  // Implement your field logic here
  if (newField) {
    // Apply your field configuration to the page
    await page.someMethod(newField);
  }
}
```

### Frontend Implementation

#### Step 1: Update Form Interface

**File**: `frontend/src/components/modals/AddScreenshotModal.tsx`

Update the `ScreenshotFormData` interface:

```typescript
export interface ScreenshotFormData {
  // ... existing fields
  newField?: YourFieldType; // Add your new field
}
```

#### Step 2: Update Default Form Data

Add default value for your new field:

```typescript
const [formData, setFormData] = useState<ScreenshotFormData>({
  // ... existing defaults
  newField: defaultValue, // Set appropriate default
});
```

#### Step 3: Add UI Components

Add form controls for your new field. Use the standard input styling:

```tsx
{/* Your New Field */}
<div>
  <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium">
    Your Field Label
  </label>
  <Input
    type="text" // or appropriate input type
    placeholder="Enter value"
    value={formData.newField || ''}
    onChange={(e) => setFormData(prev => ({
      ...prev,
      newField: e.target.value
    }))}
    className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
  />
</div>
```

#### Step 4: Update API Client

**File**: `frontend/src/lib/api.ts`

Update the `createScreenshot` method to handle your new field:

```typescript
async createScreenshot(url: string, projectId: string, timeFrames?: number[], options?: any) {
  const payload: any = { url, projectId };
  
  if (options) {
    const { 
      // ... existing options
      newField,
      ...otherOptions 
    } = options;
    
    // Handle your field appropriately
    if (newField) {
      // If it goes at root level:
      payload.newField = newField;
      
      // OR if it goes in options object:
      configOptions.newField = newField;
    }
  }
  
  const response = await this.client.post('/screenshots', payload);
  return response.data;
}
```

### Field Placement Guidelines

#### Root Level Fields
These go directly in the request payload:
- Authentication options (`basicAuth`, `customCookies`)
- Screenshot type modifiers (`timeFrames`, `autoScroll`)
- Core functionality fields

#### Options Object Fields
These go nested in the `options` object:
- Page configuration (`cookiePrevention`, `deviceScaleFactor`)
- Custom content injection (`customCSS`, `customJS`)
- Display/rendering options

### Standard Input Styling

Always use this className for consistent input styling:

```css
className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
```

### UI Organization

#### Current Modal Sections
The AddScreenshotModal is organized into the following collapsible sections:

1. **Authentication Options** - HTTP Basic Auth and custom cookies
2. **Advanced Options** - Device scale, CSS/JS injection, timing options
3. **Interactive Triggers** - Click selectors for interactive elements
4. **Form Automation** - Multi-step form filling workflows

#### CSS/JS Injection Timing Options
Located in the **Advanced Options** section, these options control when custom CSS/JS is injected:

- **Inject CSS/JS before navigation**: Controls whether injection happens before or after page navigation
- **Inject JS before viewport is set**: Fine-grained control for JS injection timing relative to viewport configuration

These options are conditionally displayed:
- First option appears when Custom CSS or Custom JS is provided
- Second option appears when Custom JS is provided AND "inject before navigation" is enabled

#### Collapsible Sections
Organize fields into logical sections:

```tsx
{/* Your Section */}
<div className="space-y-4">
  <button
    type="button"
    onClick={() => setShowYourSection(!showYourSection)}
    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
  >
    <YourIcon className="h-4 w-4" />
    Your Section Title
    {showYourSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
  </button>
  
  {showYourSection && (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Your fields here */}
    </div>
  )}
</div>
```

### Testing Your Implementation

1. **Backend Testing**:
   ```bash
   cd backend
   npm run build  # Ensure no TypeScript errors
   npm run dev    # Test the API
   ```

2. **Frontend Testing**:
   ```bash
   cd frontend
   npm run build  # Ensure no TypeScript errors
   npm run dev    # Test the UI
   ```

3. **End-to-End Testing**:
   - Create a screenshot with your new field
   - Verify the field is passed correctly through the API
   - Check that the field affects the screenshot as expected

### Common Patterns

#### Boolean Fields (Checkboxes)
```tsx
<div className="flex items-center space-x-3">
  <input
    type="checkbox"
    id="yourField"
    checked={formData.yourField}
    onChange={(e) => setFormData(prev => ({
      ...prev,
      yourField: e.target.checked
    }))}
    className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
  />
  <label htmlFor="yourField" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
    Your Field Description
  </label>
</div>
```

#### Select Fields (Dropdowns)
```tsx
<select
  value={formData.yourField}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    yourField: e.target.value
  }))}
  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

#### Textarea Fields
```tsx
<textarea
  placeholder="Enter your content"
  value={formData.yourField}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    yourField: e.target.value
  }))}
  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
  rows={3}
/>
```

### Documentation Updates

After implementing your field:

1. **Update API Documentation**: Add the new field to API examples
2. **Update User Guide**: Explain the field's purpose and usage
3. **Update Developer Guide**: Document any special considerations
4. **Add Code Comments**: Explain complex field logic

This guide ensures consistent implementation across the entire application stack.

#### Security Headers
```typescript
// Example security headers for authentication
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};
```

### Data Protection
- **Credential Encryption**: Consider encrypting stored authentication data
- **Audit Trails**: Log authentication events for security monitoring
- **Access Control**: Implement proper user permissions for sensitive features
- **Session Management**: Secure session handling for authenticated users

---

*Last Updated: January 2025*
*Version: 2.1.0*

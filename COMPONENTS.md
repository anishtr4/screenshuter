# Screenshot SaaS - Component Library

## Design System Overview

The Screenshot SaaS application uses a modern design system based on a professional blue-indigo-slate color palette with intense glassmorphism effects, smooth butter-like animations, and compact layouts. The design emphasizes professional aesthetics suitable for business applications.

## Color Palette

### Primary Colors
```css
/* Blue Gradient */
--blue-500: #3b82f6
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Indigo Gradient */
--indigo-500: #6366f1
--indigo-600: #4f46e5
--indigo-700: #4338ca

/* Slate Neutrals */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a
```

### Status Colors
```css
/* Success */
--green-500: #10b981
--green-600: #059669

/* Warning */
--yellow-500: #f59e0b
--yellow-600: #d97706

/* Error */
--red-500: #ef4444
--red-600: #dc2626

/* Purple (Super Admin) */
--purple-500: #8b5cf6
--purple-600: #7c3aed
```

## Layout Components

### DashboardLayout
Main layout wrapper for all dashboard pages with enhanced glassmorphism sidebar.

```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout'

<DashboardLayout>
  <div>Page content</div>
</DashboardLayout>
```

**Features:**
- Ultra glassmorphism sidebar with 40px backdrop blur
- Thunder icon in sidebar logo
- Smooth hover animations (700ms duration)
- Dual shimmer effects on menu items
- Enhanced icon container animations with scale and rotation
- Compact menu items with reduced padding
- Professional gradient backgrounds
- Mobile-friendly overlay
- Dark mode support

## Page Components

### DashboardPage
Main dashboard with project overview and statistics.

```tsx
import { DashboardPage } from '@/components/pages/DashboardPage'
```

**Features:**
- Project grid with glassmorphism cards
- Hover shimmer effects
- Statistics display with gradient pills
- Recent activity tracking

### ProjectsPage
Project management page with enhanced grid layout.

```tsx
import { ProjectsPage } from '@/components/pages/ProjectsPage'
```

**Features:**
- Enhanced glassmorphism project cards
- Smooth hover animations
- Project creation modal
- Search and filtering

### ProjectDetailPage
Detailed project view with screenshots and collections.

```tsx
import { ProjectDetailPage } from '@/components/pages/ProjectDetailPage'
```

**Features:**
- Professional grid action buttons
- Collection management
- Screenshot viewing and organization
- PDF generation and ZIP downloads
- Real-time progress tracking

### ApiKeysPage
API key management with enhanced security features.

```tsx
import { ApiKeysPage } from '@/components/pages/ApiKeysPage'
```

**Features:**
- Shimmer loading states
- Glassmorphism API key cards
- Deletion confirmation modals
- Compact layout design

### ConfigsPage
System configuration management.

```tsx
import { ConfigsPage } from '@/components/pages/ConfigsPage'
```

**Features:**
- Enhanced loading states with shimmer effects
- Glassmorphism config cards
- Individual setting items with gradient backgrounds
- Compact spacing and professional styling

### UsersPage
User management for administrators.

```tsx
import { UsersPage } from '@/components/pages/UsersPage'
```

**Features:**
- Modern table design
- Enhanced empty states
- User role management
- Bulk operations
- Professional styling throughout

## UI Components

### Button
Professional button component with subtle styling for business applications.

```tsx
import { Button } from '@/components/ui/button'

// Primary button (professional style)
<Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 rounded-lg font-medium">
  Primary Action
</Button>

// Secondary button
<Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-300">
  Secondary Action
</Button>

// Danger button
<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
  <Trash2 className="h-4 w-4" />
  Delete
</Button>

// Grid action buttons (professional)
<Button className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200">
  <Download className="h-4 w-4 mr-1" />
  ZIP
</Button>
```

**Variants:**
- `default`: Primary solid button
- `outline`: Border button
- `ghost`: Transparent button
- `destructive`: Danger/delete button

**Sizes:**
- `sm`: Small button (grid actions)
- `default`: Default size
- `lg`: Large button

### Card Components

#### Modern Card
Glass morphism card with backdrop blur.

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

#### Project Card
Specialized card for project display.

```tsx
<div className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-2xl transition-all duration-300">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
  
  <div className="relative p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
        <FolderOpen className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center space-x-2">
        {/* Action buttons */}
      </div>
    </div>
    
    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
      Project Name
    </h3>
    <p className="text-slate-600 dark:text-slate-400 mb-4">
      Project description
    </p>
    
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span>Created Jan 1, 2024</span>
      <span>5 screenshots</span>
    </div>
  </div>
</div>
```

### Form Components

#### Input Field
Styled input with blue focus states.

```tsx
<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
/>
```

#### Search Input
Input with search icon.

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
  />
</div>
```

#### Select Dropdown
Styled select element.

```tsx
<select className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
  <option value="">Select option</option>
  <option value="option1">Option 1</option>
</select>
```

### Modal Components

#### AddScreenshotModal
Comprehensive modal for creating screenshots with various options.

```tsx
import { AddScreenshotModal } from '@/components/modals/AddScreenshotModal'

<AddScreenshotModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  projectId={projectId}
  onScreenshotAdded={handleScreenshotAdded}
/>
```

**Features:**
- Single screenshot capture
- Frame screenshots with time intervals
- Website crawling
- Auto-scroll options
- Real-time progress tracking

#### CollectionFramesModal
Modal for viewing collection screenshots with navigation.

```tsx
import { CollectionFramesModal } from '@/components/modals/CollectionFramesModal'

<CollectionFramesModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  collection={collection}
  screenshots={screenshots}
/>
```

#### PDFConfigModal
Modal for configuring PDF generation settings.

```tsx
import { PDFConfigModal } from '@/components/modals/PDFConfigModal'

<PDFConfigModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onGenerate={handlePDFGenerate}
  type="collection" // or "project"
/>
```

#### ConfirmationModal
Reusable confirmation dialog with professional styling.

```tsx
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'

<ConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="Delete Collection"
  description="Are you sure you want to delete this collection? This action cannot be undone."
  confirmText="Delete"
  type="danger"
/>
```

#### FullImageModal
Modal for viewing full-size screenshots.

```tsx
import { FullImageModal } from '@/components/modals/FullImageModal'

<FullImageModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  imageUrl={imageUrl}
  title={screenshotTitle}
/>
```

### Badge Components

#### Role Badge
User role indicator.

```tsx
// Super Admin
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
  <Crown className="h-3 w-3 mr-1" />
  Super Admin
</span>

// Admin
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
  <Shield className="h-3 w-3 mr-1" />
  Admin
</span>

// User
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
  User
</span>
```

#### Status Badge
Status indicator.

```tsx
// Active
<span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
  Active
</span>

// Inactive
<span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
  Inactive
</span>
```

## Page Components

### Header Section
Standard page header with icon and actions.

```tsx
<div className="flex items-center justify-between mb-8">
  <div className="flex items-center space-x-4">
    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
      <Icon className="h-7 w-7 text-white" />
    </div>
    <div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        Page Title
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-1">
        Page description
      </p>
    </div>
  </div>
  <div className="flex items-center space-x-3">
    {/* Action buttons */}
  </div>
</div>
```

### Empty State
Engaging empty state with call-to-action.

```tsx
<div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
  
  <div className="relative p-12">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto w-fit">
          <Icon className="h-12 w-12 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        No items found
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
        Get started by creating your first item.
      </p>
      <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold text-base">
        <Plus className="h-5 w-5 mr-2" />
        Create First Item
      </Button>
    </div>
  </div>
</div>
```

### Loading States

#### Skeleton Loader
```tsx
<div className="animate-pulse">
  <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
</div>

// Multiple items
<div className="space-y-4">
  {[...Array(4)].map((_, i) => (
    <div key={i} className="animate-pulse">
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
    </div>
  ))}
</div>
```

#### Loading Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
</div>
```

## Animation Classes

### Smooth Transitions
```css
/* Professional button transitions */
.transition-colors { transition: background-color 0.2s ease, color 0.2s ease; }

/* Butter-smooth sidebar animations */
.transition-all { transition: all 0.7s ease-out; }

/* Quick interactions */
.transition-quick { transition: all 0.2s ease-out; }

/* Slow, smooth effects */
.transition-slow { transition: all 0.7s ease-out; }
```

### Hover Effects
```css
/* Subtle scale for professional look */
.hover-scale:hover { transform: scale(1.02); }

/* Enhanced shadows */
.hover-shadow:hover { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

/* Smooth lift effect */
.hover-lift:hover { transform: translateY(-1px); }

/* Shimmer effect for cards */
.shimmer-effect {
  position: relative;
  overflow: hidden;
}

.shimmer-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.shimmer-effect:hover::before {
  left: 100%;
}
```

### Glassmorphism Effects
```css
/* Ultra glassmorphism */
.glass-ultra {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Standard glassmorphism */
.glass-standard {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Dark mode glassmorphism */
.dark .glass-ultra {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(71, 85, 105, 0.4);
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile first approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Common Responsive Patterns
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Responsive flex
<div className="flex flex-col sm:flex-row gap-4">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
```

## Dark Mode Support

All components support dark mode using Tailwind's dark mode classes:

```tsx
// Text colors
<p className="text-slate-900 dark:text-slate-100">

// Background colors
<div className="bg-white dark:bg-slate-900">

// Border colors
<div className="border-slate-200 dark:border-slate-700">
```

## Accessibility

### Focus States
All interactive elements include focus states:

```css
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### ARIA Labels
```tsx
<button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</button>
```

### Semantic HTML
Use proper semantic elements:
- `<main>` for main content
- `<nav>` for navigation
- `<section>` for content sections
- `<article>` for standalone content

---

*Last Updated: January 2025*

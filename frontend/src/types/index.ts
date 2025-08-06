export interface User {
  id: string
  _id?: string
  firstName: string
  lastName: string
  email: string
  role: 'super_admin' | 'user'
  tokenCreationEnabled: boolean
  active: boolean
  createdAt: string
  lastLogin?: string | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  limits: UserLimits | null
}

export interface UserLimits {
  screenshots: {
    used: number
    limit: number
    remaining: number
  }
  projects: {
    used: number
    limit: number
    remaining: number
  }
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string
  createdAt: string
  updatedAt?: string
  screenshotCount?: number
  collectionCount?: number
}

export interface Screenshot {
  id: string
  _id?: string
  projectId?: string
  url: string
  title?: string
  imagePath: string | null
  thumbnailPath?: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata?: {
    width?: number
    height?: number
    fileSize?: number
    format?: string
    capturedAt?: string
    device?: string
    viewport?: {
      width: number
      height: number
    }
    // Trigger selector related fields
    triggerIndex?: number
    triggerSelector?: string
    triggerDescription?: string
    title?: string
    description?: string
    timestamp?: string
    isCollection?: boolean
    totalFrames?: number
  }
  createdAt: string
  updatedAt?: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  projectId: string
  screenshotIds: string[]
  createdAt: string
  updatedAt?: string
}

export interface ApiToken {
  id: string
  name: string
  token?: string
  permissions: string[]
  lastUsed?: string
  createdAt: string
  expiresAt?: string
}

export interface Config {
  id: string
  key: string
  value: any
  description?: string
  type: 'string' | 'number' | 'boolean' | 'object'
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

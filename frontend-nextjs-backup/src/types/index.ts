export interface User {
  id: string
  _id?: string
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
  type: 'normal' | 'crawl' | 'collection'
  collectionId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  metadata?: {
    title?: string
    width?: number
    height?: number
    fileSize?: number
    capturedAt?: string
    screenshotCount?: number
  }
  createdAt: string
  // Collection flags from unified API
  isIndividual?: boolean
  isCollection?: boolean
  isCollectionFolder?: boolean
  collectionInfo?: {
    id: string
    name: string
    baseUrl: string
    screenshotCount?: number
  } | null
  frames?: Screenshot[] // For collection folders, contains all screenshots in the collection
}

export interface Collection {
  id: string
  projectId: string
  baseUrl: string
  name: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  screenshotCount: number
}

export interface ApiToken {
  id: string
  name: string
  token?: string // Only available during creation
  active: boolean
  lastUsed?: string
  createdAt: string
}

export interface Config {
  id: string
  key: string
  value: number | string | boolean
  description?: string
  updatedAt: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminUsers: number
  regularUsers: number
  usersWithTokensEnabled: number
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export interface ProjectsResponse {
  projects: Project[]
  pagination: PaginationInfo
}

export interface ProjectDetailsResponse {
  project: Project
  screenshots: Screenshot[]
}

export interface CollectionScreenshotsResponse {
  collection: Collection
  screenshots: Screenshot[]
  pagination: PaginationInfo
}

export interface UsersResponse {
  users: User[]
  pagination: PaginationInfo
}

export interface TokensResponse {
  tokens: ApiToken[]
}

export interface ConfigsResponse {
  configs: Config[]
}

export interface CrawlResponse {
  collection: Collection
  urls: string[]
  urlCount: number
}

export interface SocketEvents {
  'screenshot-status': {
    screenshotId: string
    status: Screenshot['status']
    imagePath?: string
    thumbnailPath?: string
    metadata?: Screenshot['metadata']
    error?: string
  }
}

export type ScreenshotStatus = Screenshot['status']
export type UserRole = User['role']

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { store } from '@/store'
import { clearAuth } from '@/store/slices/authSlice'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = store.getState().auth.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Don't redirect if we're already on auth pages or if it's a login/signup request
          const isAuthRequest = error.config?.url?.includes('/auth/')
          const isAuthPage = typeof window !== 'undefined' && 
            (window.location.pathname.startsWith('/auth/') || window.location.pathname === '/')
          
          if (!isAuthRequest && !isAuthPage) {
            // Clear auth state and redirect to login only for authenticated requests
            store.dispatch(clearAuth())
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Cache management
  private getCacheKey(url: string, params?: any): string {
    return `${url}${params ? JSON.stringify(params) : ''}`
  }

  private isValidCache(cacheEntry: { data: any; timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl
  }

  private async cachedRequest<T>(url: string, options: { ttl?: number; params?: any } = {}): Promise<T> {
    const { ttl = 30000, params } = options // 30 second default TTL
    const cacheKey = this.getCacheKey(url, params)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && this.isValidCache(cached)) {
      return cached.data
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey)
    if (pending) {
      return pending
    }

    // Make new request
    const requestPromise = this.client.get(url, { params }).then(response => {
      const data = response.data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      })
      this.pendingRequests.delete(cacheKey)
      return data
    }).catch(error => {
      this.pendingRequests.delete(cacheKey)
      throw error
    })

    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  clearCache(pattern?: string) {
    if (pattern) {
      const keysToDelete: string[] = []
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async signup(email: string, password: string) {
    const response = await this.client.post('/auth/signup', { email, password })
    return response.data
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile')
    return response.data
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh')
    return response.data
  }

  // Project endpoints
  async getProjects(page = 1, limit = 10) {
    return this.cachedRequest(`/projects`, {
      params: { page, limit },
      ttl: 60000 // 1 minute cache for projects
    })
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`)
    return response.data
  }

  async createProject(name: string, description?: string) {
    const response = await this.client.post('/projects', { name, description })
    return response.data
  }

  async updateProject(id: string, name: string) {
    const response = await this.client.put(`/projects/${id}`, { name })
    return response.data
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`)
    return response.data
  }

  // Screenshot endpoints
  async createScreenshot(url: string, projectId: string, timeFrames?: number[], autoScroll?: {
    enabled: boolean;
    selector: string;
    stepSize: number;
    interval: number;
  }) {
    const payload: any = { url, projectId }
    if (timeFrames && timeFrames.length > 0) {
      payload.timeFrames = timeFrames
    }
    if (autoScroll) {
      payload.autoScroll = autoScroll
    }
    const response = await this.client.post('/screenshots', payload)
    return response.data
  }

  async createCrawlScreenshot(baseUrl: string, projectId: string) {
    const response = await this.client.post('/screenshots/crawl', { baseUrl, projectId })
    return response.data
  }

  async selectCrawlUrls(collectionId: string, selectedUrls: string[]) {
    const response = await this.client.post('/screenshots/crawl/select', {
      collectionId,
      selectedUrls,
    })
    return response.data
  }

  async getScreenshot(id: string) {
    const response = await this.client.get(`/screenshots/${id}`)
    return response.data
  }

  async getProjectScreenshots(projectId: string, page = 1, limit = 20) {
    const response = await this.client.get(`/projects/${projectId}/screenshots?page=${page}&limit=${limit}`)
    return response.data
  }

  async getProjectCollections(projectId: string, page = 1, limit = 20) {
    const response = await this.client.get(`/projects/${projectId}/collections?page=${page}&limit=${limit}`)
    return response.data
  }

  async getCollectionScreenshots(id: string, page = 1, limit = 20) {
    const response = await this.client.get(`/screenshots/collection/${id}?page=${page}&limit=${limit}`)
    return response.data
  }

  async deleteScreenshot(id: string) {
    const response = await this.client.delete(`/screenshots/${id}`)
    return response.data
  }

  async deleteCollection(id: string) {
    const response = await this.client.delete(`/screenshots/collection/${id}`)
    return response.data
  }

  async downloadCollection(id: string) {
    const response = await this.client.get(`/collections/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  async generateCollectionPDF(id: string, config: any) {
    const response = await this.client.post(`/collections/${id}/pdf`, config, {
      responseType: 'blob'
    })
    return response.data
  }

  async generateProjectPDF(id: string, config: any) {
    const response = await this.client.post(`/projects/${id}/pdf`, config, {
      responseType: 'blob'
    })
    return response.data
  }

  // Token endpoints
  async getTokens() {
    const response = await this.client.get('/tokens')
    return response.data
  }

  async createToken(name: string) {
    const response = await this.client.post('/tokens', { name })
    return response.data
  }

  async updateToken(id: string, data: { name?: string; active?: boolean }) {
    const response = await this.client.patch(`/tokens/${id}`, data)
    return response.data
  }

  async deleteToken(id: string) {
    const response = await this.client.delete(`/tokens/${id}`)
    return response.data
  }

  // Admin endpoints
  async getUsers(page = 1, limit = 10) {
    const response = await this.client.get(`/users?page=${page}&limit=${limit}`)
    return response.data
  }

  async createUser(email: string, password: string, role = 'user') {
    const response = await this.client.post('/users', { email, password, role })
    return response.data
  }

  async updateUser(id: string, data: { tokenCreationEnabled?: boolean; active?: boolean }) {
    const response = await this.client.patch(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`)
    return response.data
  }

  async getUserStats() {
    const response = await this.client.get('/users/stats')
    return response.data
  }

  // Config endpoints
  async getConfigs() {
    const response = await this.client.get('/configs')
    return response.data
  }

  async updateConfig(id: string, value: any) {
    const response = await this.client.patch(`/configs/${id}`, { value })
    return response.data
  }

  // Image endpoints
  getImageUrl(screenshotId: string, type: 'full' | 'thumbnail' = 'full') {
    const token = store.getState().auth.token
    return `${API_BASE_URL}/images/${screenshotId}?type=${type}&token=${token}`
  }

  async getImageInfo(screenshotId: string) {
    const response = await this.client.get(`/images/${screenshotId}/info`)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient

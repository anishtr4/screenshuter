import axios, { type AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api'

class ApiClient {
  private client: AxiosInstance

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
        const token = localStorage.getItem('token')
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
            (window.location.pathname.startsWith('/login') || 
             window.location.pathname.startsWith('/signup') || 
             window.location.pathname === '/')
          
          if (!isAuthRequest && !isAuthPage) {
            // Clear auth state and redirect to login only for authenticated requests
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.client.post('/auth/register', { email, password, name })
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      // Ignore logout errors
    }
  }

  // Project methods
  async getProjects(page = 1, limit = 10) {
    const response = await this.client.get(`/projects?page=${page}&limit=${limit}`)
    return response.data
  }

  async createProject(name: string, description?: string) {
    const response = await this.client.post('/projects', { name, description })
    return response.data
  }

  async updateProject(id: string, data: { name?: string; description?: string }) {
    const response = await this.client.put(`/projects/${id}`, data)
    return response.data
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`)
    return response.data
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`)
    return response.data
  }

  // Screenshot methods
  async getScreenshots(projectId: string, page = 1, limit = 10) {
    const response = await this.client.get(`/projects/${projectId}/screenshots?page=${page}&limit=${limit}`)
    return response.data
  }

  async createScreenshot(url: string, projectId: string, timeFrames?: number[], options?: any) {
    const payload: any = { url, projectId }
    
    if (timeFrames && timeFrames.length > 0) {
      // Frame screenshot
      payload.timeFrames = timeFrames
      payload.type = 'frame'
    }
    
    if (options) {
      // Extract autoScroll from options and put it at root level (backend expects it there)
      if (options.autoScroll) {
        payload.autoScroll = options.autoScroll
      }
      
      // Put other options in options object
      const { autoScroll, ...otherOptions } = options
      if (Object.keys(otherOptions).length > 0) {
        payload.options = otherOptions
      }
    }
    
    console.log('🚀 API Client - Frame screenshot payload:', JSON.stringify(payload, null, 2))
    
    const response = await this.client.post(`/screenshots`, payload)
    return response.data
  }

  async createCrawlScreenshot(baseUrl: string, projectId: string) {
    console.log('🚀 API Client - Creating crawl screenshot with:', { baseUrl, projectId })
    const payload = { baseUrl, projectId }
    console.log('🚀 API Client - Request payload:', payload)
    const response = await this.client.post('/screenshots/crawl', payload)
    return response.data
  }

  async selectCrawlUrls(collectionId: string, selectedUrls: string[]) {
    const response = await this.client.post('/screenshots/crawl/select', {
      collectionId,
      selectedUrls,
    })
    return response.data
  }

  async deleteScreenshot(projectId: string, screenshotId: string) {
    const response = await this.client.delete(`/projects/${projectId}/screenshots/${screenshotId}`)
    return response.data
  }

  // Collection methods
  async getCollections(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}/collections`)
    return response.data
  }

  async createCollection(projectId: string, data: any) {
    const response = await this.client.post(`/projects/${projectId}/collections`, data)
    return response.data
  }

  async deleteCollection(projectId: string, collectionId: string) {
    const response = await this.client.delete(`/projects/${projectId}/collections/${collectionId}`)
    return response.data
  }

  async getCollectionScreenshots(collectionId: string, limit = 1000) {
    // Add admin bypass parameter for admin users and pagination
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = user.role === 'admin'
    const params = new URLSearchParams()
    
    if (isAdmin) {
      params.append('adminBypass', 'true')
    }
    params.append('limit', limit.toString())
    
    const url = `/screenshots/collection/${collectionId}?${params.toString()}`
    
    const response = await this.client.get(url)
    return response.data
  }

  // User methods
  async getUsers(page = 1, limit = 10) {
    const response = await this.client.get(`/users?page=${page}&limit=${limit}`)
    return response.data
  }

  async createUser(data: any) {
    const response = await this.client.post('/users', data)
    return response.data
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.patch(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`)
    return response.data
  }

  // Bulk user operations
  async bulkUpdateUsers(userIds: string[], data: { active?: boolean; role?: string; tokenCreationEnabled?: boolean }) {
    const promises = userIds.map(id => this.updateUser(id, data))
    return Promise.all(promises)
  }

  async bulkDeleteUsers(userIds: string[]) {
    const promises = userIds.map(id => this.deleteUser(id))
    return Promise.all(promises)
  }

  // User management specific methods
  async activateUser(id: string) {
    return this.updateUser(id, { active: true })
  }

  async deactivateUser(id: string) {
    return this.updateUser(id, { active: false })
  }

  async enableTokenCreation(id: string) {
    return this.updateUser(id, { tokenCreationEnabled: true })
  }

  async disableTokenCreation(id: string) {
    return this.updateUser(id, { tokenCreationEnabled: false })
  }

  async changeUserRole(id: string, role: 'user' | 'super_admin') {
    return this.updateUser(id, { role })
  }

  async getUserStats() {
    const response = await this.client.get('/users/stats')
    return response.data
  }

  async getPendingUsers() {
    const response = await this.client.get('/users/pending')
    return response.data
  }

  async approveUser(id: string) {
    const response = await this.client.patch(`/users/${id}/approve`)
    return response.data
  }

  // Settings/Config methods
  async getSettings() {
    const response = await this.client.get('/configs')
    return response.data
  }

  async updateSettings(data: any) {
    const response = await this.client.put('/configs', data)
    return response.data
  }

  async updateConfig(configId: string, value: any) {
    const response = await this.client.patch(`/configs/${configId}`, { value })
    return response.data
  }

  // Token methods
  async getTokens() {
    const response = await this.client.get('/tokens')
    return response.data
  }

  async createToken(name: string) {
    const response = await this.client.post('/tokens', { name })
    return response.data
  }

  async deleteToken(id: string) {
    const response = await this.client.delete(`/tokens/${id}`)
    return response.data
  }

  // PDF Generation endpoints
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

  // Collection ZIP download
  async downloadCollectionZip(id: string) {
    const response = await this.client.get(`/collections/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient

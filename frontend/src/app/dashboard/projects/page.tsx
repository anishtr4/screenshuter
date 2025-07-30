'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddScreenshotModal, ScreenshotFormData } from '@/components/modals/AddScreenshotModal'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { apiClient } from '@/lib/api'
import { 
  Plus, 
  FolderOpen, 
  Search,
  Trash2,
  Calendar,
  Image
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Screenshot {
  id: string
  url: string
  title?: string
  status: 'processing' | 'completed' | 'failed'
  createdAt: string
  thumbnailUrl?: string
  imagePath?: string
  thumbnailPath?: string
  metadata?: any
  type?: string
}

interface Project {
  id: string
  name: string
  description?: string
  userId: string
  createdAt: string
  updatedAt?: string
  screenshotCount: number
  collectionCount: number
  screenshots?: Screenshot[]
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { screenshotProgress, clearScreenshotProgress } = useSocket()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    } else {
      loadProjects()
    }
  }, [token, user, router])

  // Listen for screenshot completion to refresh project counts
  useEffect(() => {
    Object.values(screenshotProgress).forEach(progress => {
      if (progress.status === 'completed' || progress.status === 'failed') {
        // Refresh projects to update screenshot counts
        loadProjects()
        // Clear the progress to avoid repeated refreshes
        clearScreenshotProgress(progress.screenshotId)
      }
    })
  }, [screenshotProgress, clearScreenshotProgress])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getProjects(1, 50) // Get all projects for projects page
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }



  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredProjects = projects.filter(project =>
    project?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    (project?.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      setCreating(true)
      const response = await apiClient.createProject(name, description)
      
      // Add the new project to the list
      const newProject: Project = {
        id: response.project.id,
        name: response.project.name,
        description: response.project.description,
        userId: response.project.userId,
        createdAt: response.project.createdAt,
        updatedAt: response.project.updatedAt,
        screenshotCount: 0,
        collectionCount: 0
      }
      
      setProjects([newProject, ...projects])
      setShowCreateModal(false)
      toast.success('Project created successfully!')
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleAddScreenshot = (projectId: string) => {
    setSelectedProjectId(projectId)
    setShowScreenshotModal(true)
  }

  const handleScreenshotSubmit = async (data: ScreenshotFormData) => {
    try {
      setIsLoading(true)
      
      if (data.mode === 'crawl') {
        if (data.selectedUrls && data.collectionId) {
          // New crawl workflow - URLs already selected and capture started
          // Just reload projects to update screenshot count
          await loadProjects()
        } else {
          // Old crawl workflow - create crawl screenshot collection
          await apiClient.createCrawlScreenshot(data.url, selectedProjectId)
          await loadProjects()
          toast.success('Crawl screenshot started!')
        }
      } else {
        // Normal screenshot
        await apiClient.createScreenshot(data.url, selectedProjectId)
        
        // Clear cache to ensure fresh data when socket updates come
        apiClient.clearCache('/projects')
        
        // Optimistic UI: The project screenshot count will be updated via socket events
        // when the screenshot completes, so no need for immediate refresh
        toast.success('Screenshot capture started!')
      }
      
      setShowScreenshotModal(false)
    } catch (error) {
      console.error('Failed to start screenshot capture:', error)
      toast.error('Failed to start screenshot capture')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsLoading(true)
      await apiClient.deleteProject(projectId)
      
      // Remove the project from the list
      setProjects(projects.filter(p => p.id !== projectId))
      toast.success('Project deleted successfully!')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DashboardLayout title="Projects" subtitle="Manage your screenshot projects">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-4 rounded-xl backdrop-blur-xl bg-white/20 dark:bg-orange-800/20 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-500 dark:placeholder-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl"
          />
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>


      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <GlassCard 
            key={project.id} 
            className="group cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <GlassCardContent className="p-6">
              {/* Project Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/30">
                    <FolderOpen className="h-8 w-8 text-white drop-shadow-sm" />
                  </div>
                </div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id)
                  }}
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Project Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 group-hover:text-orange-700 dark:group-hover:text-orange-200 transition-colors leading-tight">
                  {project.name}
                </h3>
                
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Image className="h-4 w-4 mr-1" />
                    <span>{project.screenshotCount || project.screenshots?.length || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(project.updatedAt || project.createdAt)}</span>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first project'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        loading={creating}
      />
      
      {/* Add Screenshot Modal */}
      <AddScreenshotModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        onSubmit={handleScreenshotSubmit}
        projectId={selectedProjectId}
        isLoading={isLoading}
      />
    </DashboardLayout>
  )
}

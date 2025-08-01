import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  FolderOpen, 
  Camera, 
  Calendar,
  Trash2
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { Project } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Dashboard - Screenshot SaaS'
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getProjects(1, 6) // Limit to 6 recent projects for dashboard
      setProjects(response.projects || response.data || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Manage your projects and screenshots">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your projects and screenshots
          </p>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <GlassCard className="group hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <GlassCardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Camera className="h-3 w-3" />
                            <span>{project.screenshotCount || 0}</span>
                          </div>
                          {(project.collectionCount || 0) > 0 && (
                            <div className="flex items-center space-x-1">
                              <FolderOpen className="h-3 w-3" />
                              <span>{project.collectionCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.updatedAt || project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first project to start organizing screenshots
            </p>
            <Link to="/projects">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

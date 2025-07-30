'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  FolderOpen, 
  Camera, 
  Calendar,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Project } from '@/types'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { CardSkeleton, LoadingSpinner } from '@/components/ui/loading'
import { SimplePageTransition } from '@/components/ui/page-transition'

export default function DashboardPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
    icon?: 'delete' | 'user' | 'key' | 'shield' | 'warning'
    loading?: boolean
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    // Set page title
    document.title = 'Dashboard - Screenshot SaaS'
  }, [])

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
      return
    }
    loadProjects()
  }, [token, user, router])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getProjects(1, 6) // Limit to 6 recent projects for dashboard
      setProjects((response as any).projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-orange-600 dark:text-orange-400">Loading...</p>
        </div>
      </div>
    )
  }



  const handleCreateProject = async (name: string, description?: string) => {
    try {
      setCreating(true)
      const newProject = await apiClient.createProject(name, description)
      setProjects([newProject, ...projects])
      setShowCreateModal(false)
      toast.success('Project created successfully')
      // Clear cache to ensure fresh data on next load
      apiClient.clearCache('/projects')
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = (project: Project, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project',
      description: `Are you sure you want to delete "${project.name}"? This will permanently delete all screenshots and collections in this project. This action cannot be undone.`,
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }))
          await apiClient.deleteProject(project.id)
          setProjects(projects.filter(p => p.id !== project.id))
          toast.success('Project deleted successfully')
          // Clear cache to ensure fresh data
          apiClient.clearCache('/projects')
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }))
        } catch (error) {
          console.error('Failed to delete project:', error)
          toast.error('Failed to delete project')
          setConfirmModal(prev => ({ ...prev, loading: false }))
        }
      }
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  return (
    <SimplePageTransition>
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
            <CardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <GlassCard className="group hover:scale-105 transition-transform duration-200 cursor-pointer">
                    <GlassCardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                          <FolderOpen className="h-6 w-6 text-white" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleDeleteProject(project, e)}
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
                              <span>{project.screenshotCount}</span>
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
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}

          {/* Add Project Modal */}
          <AddProjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateProject}
            loading={creating}
          />

          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            description={confirmModal.description}
            type={confirmModal.type}
            icon={confirmModal.icon}
            loading={confirmModal.loading}
          />
        </div>
      </DashboardLayout>
    </SimplePageTransition>
  )
}

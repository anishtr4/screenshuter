import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Camera, Clock, Eye, Edit, Trash2, Users } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { EditProjectModal } from '@/components/modals/EditProjectModal'
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal'


interface Project {
  id: string
  name: string
  description?: string
  screenshotCount?: number
  createdAt: string
  updatedAt: string
  userId?: string
  user?: {
    name: string
    email: string
  }
}

const getProjectColor = (index: number) => {
  const colors = [
    'from-blue-500 to-indigo-500',
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-cyan-500'
  ]
  return colors[index % colors.length]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

const ProjectsPage = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      setIsCreating(true)
      await apiClient.createProject(name, description)
      toast.success('Project created successfully!')
      setShowAddModal(false)
      await loadProjects() // Refresh the projects list
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (name: string, description?: string) => {
    if (!selectedProject) return
    
    try {
      setIsUpdating(true)
      await apiClient.updateProject(selectedProject.id, { name, description })
      toast.success('Project updated successfully!')
      setShowEditModal(false)
      setSelectedProject(null)
      await loadProjects() // Refresh the projects list
    } catch (error) {
      console.error('Failed to update project:', error)
      toast.error('Failed to update project')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProject) return
    
    try {
      setIsDeleting(true)
      await apiClient.deleteProject(selectedProject.id)
      toast.success('Project deleted successfully!')
      setShowDeleteModal(false)
      setSelectedProject(null)
      await loadProjects() // Refresh the projects list
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <DashboardLayout title="Projects" subtitle="Manage your screenshot projects and collections">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Projects
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage your screenshot projects
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 h-64"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
                
                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${getProjectColor(index)} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <FolderOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        active
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                    
                    {/* Stats */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <Camera className="h-4 w-4 text-blue-500" />
                          <span>{project.screenshotCount || 0} screenshots</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                      {project.user && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>Created by {project.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200"
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200 hover:bg-red-50 text-red-600 dark:border-red-800 dark:hover:bg-red-900/20 dark:text-red-400 transition-all duration-200"
                      onClick={() => handleDeleteProject(project)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State (if no projects) */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-12 max-w-md mx-auto">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first project to start capturing screenshots
              </p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateProject}
        loading={isCreating}
      />
      
      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateProject}
        loading={isUpdating}
        project={selectedProject || undefined}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone and will delete all screenshots in this project.`}
        confirmText="Delete Project"
        type="danger"
      />

    </DashboardLayout>
  )
}

export default ProjectsPage

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
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Stunning Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="group">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-xl h-72">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                  
                  {/* Loading content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-xl animate-pulse"></div>
                      <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                      <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex space-x-4">
                        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-slate-50/70 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-slate-600/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
              >
                {/* Stunning Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-purple-400/15 via-pink-400/10 to-transparent rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                
                {/* Hover shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-3xl"></div>
                </div>
                
                <div className="relative p-7">
                  {/* Enhanced Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                      <div className={`relative p-3.5 rounded-2xl bg-gradient-to-br ${getProjectColor(index)} shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <FolderOpen className="h-7 w-7 text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm">
                        ✨ Active
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Content */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided for this project'}
                    </p>
                    
                    {/* Enhanced Stats */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                          <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{project.screenshotCount || 0}</span>
                          <span className="text-xs text-blue-600/80 dark:text-blue-400/80">shots</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="h-3 w-3 text-indigo-500" />
                          <span className="font-medium">{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                      {project.user && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <Users className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">by {project.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stunning Action Buttons */}
                  <div className="flex items-center space-x-2 mt-6 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-slate-200/60 hover:border-slate-300 bg-white/80 hover:bg-white dark:border-slate-600/60 dark:hover:border-slate-500 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 transform hover:scale-105 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md"
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200/60 hover:border-red-300 bg-red-50/80 hover:bg-red-100 text-red-600 dark:border-red-700/60 dark:hover:border-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 transition-all duration-300 transform hover:scale-105 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md"
                      onClick={() => handleDeleteProject(project)}
                    >
                      <Trash2 className="h-4 w-4" />
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

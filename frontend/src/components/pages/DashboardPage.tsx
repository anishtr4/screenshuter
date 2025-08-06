import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { 
  Plus,
  FolderOpen, 
  Camera, 
  Layers
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
    <DashboardLayout title={`Welcome back, ${user?.email?.split('@')[0] || 'User'}!`} subtitle="Manage your projects and screenshots">
      <div className="space-y-8">

        {/* Stunning Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="group">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-xl h-64">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                  
                  {/* Loading content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-amber-300 dark:from-orange-600 dark:to-amber-700 rounded-2xl animate-pulse"></div>
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                      <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-slate-50/70 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-slate-600/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer">
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
                        <div className={`relative p-3.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
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
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/30 dark:border-slate-700/30">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/30 dark:border-blue-700/30">
                            <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{project.screenshotCount || 0}</span>
                          </div>
                          {(project.collectionCount || 0) > 0 && (
                            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200/30 dark:border-purple-700/30">
                              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{project.collectionCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                          {formatDate(project.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  Download,
  ExternalLink,
  Calendar,
  Image,
  List,
  Grid3X3,
  Eye,
  Trash2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Screenshot {
  id: string
  title: string
  url: string
  imageUrl: string
  status: 'completed' | 'processing' | 'failed'
  createdAt: string
  projectId: string
  projectName: string
}

// Mock data - replace with real API calls
const mockScreenshots: Screenshot[] = [
  {
    id: '1',
    title: 'Homepage Screenshot',
    url: 'https://example.com',
    imageUrl: 'https://via.placeholder.com/400x300/f97316/ffffff?text=Homepage',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    projectId: '1',
    projectName: 'E-commerce Platform'
  },
  {
    id: '2',
    title: 'Product Page',
    url: 'https://example.com/products/1',
    imageUrl: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Product+Page',
    status: 'completed',
    createdAt: '2024-01-14T15:45:00Z',
    projectId: '1',
    projectName: 'E-commerce Platform'
  },
  {
    id: '3',
    title: 'Blog Homepage',
    url: 'https://blog.example.com',
    imageUrl: 'https://via.placeholder.com/400x300/d97706/ffffff?text=Blog+Home',
    status: 'processing',
    createdAt: '2024-01-13T09:20:00Z',
    projectId: '2',
    projectName: 'Blog Redesign'
  },
  {
    id: '4',
    title: 'Contact Page',
    url: 'https://example.com/contact',
    imageUrl: 'https://via.placeholder.com/400x300/b45309/ffffff?text=Contact',
    status: 'failed',
    createdAt: '2024-01-12T14:10:00Z',
    projectId: '1',
    projectName: 'E-commerce Platform'
  }
]

export default function ScreenshotsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [screenshots, setScreenshots] = useState<Screenshot[]>(mockScreenshots)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 dark:text-orange-400">Loading...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredScreenshots = screenshots.filter(screenshot => {
    const matchesSearch = screenshot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         screenshot.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         screenshot.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || screenshot.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteScreenshot = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    
    setDeleting(id)
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setScreenshots(prev => prev.filter(s => s.id !== id))
      toast.success('Screenshot deleted successfully')
    } catch (error) {
      toast.error('Failed to delete screenshot')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (screenshot: Screenshot) => {
    // Mock download - replace with real implementation
    toast.success(`Downloading ${screenshot.title}...`)
  }

  const handleViewScreenshot = (screenshot: Screenshot) => {
    // Mock view - replace with real implementation
    window.open(screenshot.imageUrl, '_blank')
  }

  return (
    <DashboardLayout title="Screenshots" subtitle="View and manage all your screenshots">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 h-5 w-5" />
            <Input
              placeholder="Search screenshots, URLs, or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-4 rounded-xl backdrop-blur-xl bg-white/20 dark:bg-orange-800/20 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-500 dark:placeholder-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/20 border border-orange-200/40 dark:border-orange-700/40 text-orange-900 dark:text-orange-100 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-white/20 backdrop-blur-xl rounded-xl border border-orange-200/40 dark:border-orange-700/40 p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Screenshots Content */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                  <Image className="h-5 w-5 text-white" />
                </div>
                All Screenshots
              </GlassCardTitle>
              <GlassCardDescription>
                {filteredScreenshots.length} screenshot{filteredScreenshots.length !== 1 ? 's' : ''} found
              </GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        
        <GlassCardContent className="p-0">
          {filteredScreenshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
                <Image className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No screenshots found' : 'No screenshots yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create a project and start capturing screenshots'
                }
              </p>
              <Button 
                onClick={() => router.push('/dashboard/projects')}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
              >
                Go to Projects
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orange-200/20 dark:border-orange-700/30">
                    <th className="text-left p-6 font-semibold text-orange-800 dark:text-orange-200">Screenshot</th>
                    <th className="text-left p-6 font-semibold text-orange-800 dark:text-orange-200">Project</th>
                    <th className="text-left p-6 font-semibold text-orange-800 dark:text-orange-200">Status</th>
                    <th className="text-left p-6 font-semibold text-orange-800 dark:text-orange-200">Created</th>
                    <th className="text-left p-6 font-semibold text-orange-800 dark:text-orange-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScreenshots.map((screenshot) => (
                    <tr key={screenshot.id} className="border-b border-orange-100/20 dark:border-orange-800/20 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors duration-200">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
                            {screenshot.status === 'completed' ? (
                              <img 
                                src={screenshot.imageUrl} 
                                alt={screenshot.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-orange-900 dark:text-orange-100">
                              {screenshot.title}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {screenshot.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          {screenshot.projectName}
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge 
                          variant={
                            screenshot.status === 'completed' ? 'default' :
                            screenshot.status === 'processing' ? 'secondary' : 'destructive'
                          }
                          className="rounded-lg flex items-center gap-1 w-fit"
                        >
                          {screenshot.status === 'completed' && '✓'}
                          {screenshot.status === 'processing' && '⏳'}
                          {screenshot.status === 'failed' && '✗'}
                          {screenshot.status}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(screenshot.createdAt)}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {screenshot.status === 'completed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewScreenshot(screenshot)}
                                className="rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200"
                                title="View screenshot"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(screenshot)}
                                className="rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200"
                                title="Download screenshot"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteScreenshot(screenshot.id, screenshot.title)}
                            disabled={deleting === screenshot.id}
                            className="rounded-xl border-red-200 dark:border-red-700 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                            title="Delete screenshot"
                          >
                            {deleting === screenshot.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredScreenshots.map((screenshot) => (
                  <div key={screenshot.id} className="bg-white/20 dark:bg-orange-800/20 backdrop-blur-xl rounded-xl border border-orange-200/30 dark:border-orange-700/30 overflow-hidden hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-all duration-200 shadow-lg hover:shadow-xl">
                    {/* Screenshot Image */}
                    <div className="aspect-video bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center relative">
                      {screenshot.status === 'completed' ? (
                        <img 
                          src={screenshot.imageUrl} 
                          alt={screenshot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-white">
                          <Image className="h-8 w-8 mb-2" />
                          <span className="text-sm">
                            {screenshot.status === 'processing' ? 'Processing...' : 'Failed'}
                          </span>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant={
                            screenshot.status === 'completed' ? 'default' :
                            screenshot.status === 'processing' ? 'secondary' : 'destructive'
                          }
                          className="rounded-lg text-xs"
                        >
                          {screenshot.status === 'completed' && '✓'}
                          {screenshot.status === 'processing' && '⏳'}
                          {screenshot.status === 'failed' && '✗'}
                        </Badge>
                      </div>
                    </div>

                    {/* Screenshot Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-1 truncate">
                        {screenshot.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                        {screenshot.url}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                        {screenshot.projectName}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(screenshot.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center gap-2">
                        {screenshot.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewScreenshot(screenshot)}
                              className="rounded-lg border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 p-2"
                              title="View screenshot"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(screenshot)}
                              className="rounded-lg border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 p-2"
                              title="Download screenshot"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteScreenshot(screenshot.id, screenshot.title)}
                          disabled={deleting === screenshot.id}
                          className="rounded-lg border-red-200 dark:border-red-700 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 p-2"
                          title="Delete screenshot"
                        >
                          {deleting === screenshot.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </DashboardLayout>
  )
}

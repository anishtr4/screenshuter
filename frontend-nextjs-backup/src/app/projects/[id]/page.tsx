'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import { useSocket } from '@/hooks/useSocket'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { FullImageModal } from '@/components/modals/FullImageModal'
import { CollectionFramesModal } from '@/components/modals/CollectionFramesModal'
import { PDFConfigModal } from '@/components/modals/PDFConfigModal'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProgressCard } from '@/components/ui/progress-card'
import { 
  Plus, 
  Camera, 
  Search,
  Calendar,
  Globe,
  Download,
  ExternalLink,
  FolderOpen,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Archive
} from 'lucide-react'
import Link from 'next/link'
import { AddScreenshotModal } from '@/components/modals/AddScreenshotModal'
import { apiClient } from '@/lib/api'
import { Project, Screenshot, Collection } from '@/types'
import { toast } from 'sonner'

export default function ProjectDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, token } = useAppSelector((state) => state.auth)
  const { screenshotProgress, collectionProgress, isConnected, clearScreenshotProgress } = useSocket()
  const [project, setProject] = useState<Project | null>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Screenshot | null>(null)
  // Create a stable blob URL cache that persists across re-renders
  const blobUrlCacheRef = useRef<Record<string, string>>({})
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [processingScreenshots, setProcessingScreenshots] = useState<Set<string>>(new Set())
  
  // New modal states
  const [showFullImage, setShowFullImage] = useState(false)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [showCollectionFrames, setShowCollectionFrames] = useState(false)
  const [showPDFConfig, setShowPDFConfig] = useState(false)

  // Process screenshots for display with collection grouping
  const allItems = useMemo(() => {

    
    const mapped = screenshots
      .map(screenshot => ({
        ...screenshot,
        id: screenshot._id,
        title: screenshot.metadata?.title || (screenshot.status === 'processing' ? 'Loading...' : 'Untitled Screenshot'),
        status: screenshot.status || 'completed'
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(item => {
        if (!searchTerm) return true
        const title = item.title?.toLowerCase() || ''
        const url = item.url?.toLowerCase() || ''
        const collectionName = item.collectionInfo?.name?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        return title.includes(search) || url.includes(search) || collectionName.includes(search)
      })
    

    return mapped
  }, [screenshots, searchTerm])

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
      return
    }
    if (params.id) {
      loadProjectData(params.id as string)
    }
  }, [token, user, router, params.id])

  // Cleanup blob URLs on unmount only
  useEffect(() => {
    return () => {
      Object.values(blobUrlCacheRef.current).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // Listen for screenshot completion to update specific screenshot
  useEffect(() => {

    
    // Check if any screenshot just completed
    const processedIds = new Set<string>()
    
    Object.values(screenshotProgress).forEach(async (progress) => {

      
      // Prevent processing the same screenshot multiple times
      if (processedIds.has(progress.screenshotId)) {

        return
      }
      
      if (progress.status === 'completed' || progress.status === 'failed') {

        processedIds.add(progress.screenshotId)
        
        // Update the specific screenshot using socket data
        setScreenshots(prevScreenshots => {

          
          let foundMatch = false
          const updated = prevScreenshots.map(screenshot => {
            const screenshotId = screenshot._id || screenshot.id

            
            if (screenshot._id === progress.screenshotId || screenshot.id === progress.screenshotId) {

              foundMatch = true
              const updatedScreenshot = {
                ...screenshot,
                status: progress.status,
                imagePath: progress.imagePath || screenshot.imagePath,
                thumbnailPath: progress.thumbnailPath || screenshot.thumbnailPath,
                metadata: progress.metadata || screenshot.metadata,
                error: progress.error,
                // Force React to detect change by adding a timestamp
                lastUpdated: Date.now()
              }

              return updatedScreenshot
            }
            return screenshot
          })
          
          if (!foundMatch) {
            // Don't add individual screenshots from socket updates at all
            // Collections will be refreshed via collection progress events
            // Individual screenshots should only be added via API refresh
            console.log('Screenshot not found in current list, but not adding via socket to avoid collection conflicts:', progress.screenshotId);
            return updated; // Return without adding
          }
          

          
          // Force re-render by creating a completely new array
          return [...updated]
        })
        
        // Load image URL for the updated screenshot if it has an image
        if (progress.status === 'completed' && (progress.imagePath || progress.thumbnailPath)) {

          
          // For socket updates, only load single screenshot images to avoid breaking collection modals
          // Collection frame images are loaded during initial project load and should not be reloaded

          await loadSingleImageUrl(progress.screenshotId)
        }
        
        // Clear the progress to avoid repeated refreshes

        clearScreenshotProgress(progress.screenshotId)
      }
    })
  }, [screenshotProgress, collectionProgress, params.id, clearScreenshotProgress])

  // Listen for collection progress updates to refresh data when collections are created or completed
  useEffect(() => {
    const activeCollections = Object.values(collectionProgress);
    if (activeCollections.length === 0) return;
    
    // Only refresh on collection start (0%) or completion (100%)
    // Ignore intermediate progress updates (33%, 67%, etc.)
    const newCollections = activeCollections.filter(progress => progress.progress === 0);
    const completedCollections = activeCollections.filter(progress => progress.progress === 100);
    
    if (newCollections.length > 0) {
      console.log('New collection detected - refreshing project data:', newCollections.length);
      if (params.id) {
        loadProjectData(params.id as string);
      }
    } else if (completedCollections.length > 0) {
      console.log('Collection completed - refreshing project data:', completedCollections.length);
      // Add delay for completion to ensure all data is ready
      setTimeout(() => {
        if (params.id) {
          loadProjectData(params.id as string);
        }
      }, 1000);
    }
  }, [collectionProgress, params.id]);

  const loadProjectData = async (projectId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.getProject(projectId)
      
      setProject(response.project)
      setScreenshots(response.screenshots || [])
      
      // Load image blob URLs for all screenshots
      await loadImageUrls(response.screenshots || [])
    } catch (error) {
      console.error('Failed to load project data:', error)
      toast.error('Failed to load project data')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadImageUrls = async (screenshots: Screenshot[]) => {
    const newUrls: Record<string, string> = {}
    
    // Load images for all screenshots (individual and collection screenshots)
    for (const screenshot of screenshots) {
      if (screenshot._id && (screenshot.thumbnailPath || screenshot.imagePath)) {
        // Skip if we already have a stable blob URL in cache
        if (blobUrlCacheRef.current[screenshot._id]) {

          continue
        }
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${screenshot._id}?type=thumbnail`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            // Store in stable cache
            blobUrlCacheRef.current[screenshot._id] = blobUrl
            newUrls[screenshot._id] = blobUrl
          }
        } catch (error) {
          console.error(`Failed to load image for screenshot ${screenshot._id}:`, error)
        }
      }
      
      // Also load images for collection frames
      if (screenshot.frames) {
        for (const frame of screenshot.frames) {
          if (frame._id && (frame.thumbnailPath || frame.imagePath)) {
            // Skip if we already have a stable blob URL in cache
            if (blobUrlCacheRef.current[frame._id]) {

              continue
            }
            
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${frame._id}?type=thumbnail`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              if (response.ok) {
                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)
                // Store in stable cache
                blobUrlCacheRef.current[frame._id] = blobUrl
                newUrls[frame._id] = blobUrl
              }
            } catch (error) {
              console.error(`Failed to load image for frame ${frame._id}:`, error)
            }
          }
        }
      }
    }
    
    // Update state with all cached URLs (both new and existing)
    const allCachedUrls = { ...blobUrlCacheRef.current }

    setImageUrls(allCachedUrls)
  }

  const loadSingleImageUrl = async (screenshotId: string) => {
    if (!token) return
    
    // Check if we already have a stable blob URL in our cache
    const cachedUrl = blobUrlCacheRef.current[screenshotId]
    if (cachedUrl) {

      // Ensure the state reflects the cached URL
      setImageUrls(prevUrls => {
        if (prevUrls[screenshotId] !== cachedUrl) {
          return { ...prevUrls, [screenshotId]: cachedUrl }
        }
        return prevUrls
      })
      return
    }
    
    try {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${screenshotId}?type=thumbnail`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        
        // Store in stable cache first
        blobUrlCacheRef.current[screenshotId] = blobUrl
        
        // Then update state
        setImageUrls(prevUrls => {

          return {
            ...prevUrls,
            [screenshotId]: blobUrl
          }
        })
      }
    } catch (error) {
      console.error(`Failed to load single image for screenshot ${screenshotId}:`, error)
    }
  }

  const handleDeleteScreenshot = (screenshotId: string, screenshotTitle: string) => {
    // Find the item to determine if it's a collection
    const item = screenshots.find(s => (s._id || s.id) === screenshotId)
    const isCollection = item?.isCollectionFolder
    
    setConfirmModal({
      isOpen: true,
      title: isCollection ? 'Delete Collection' : 'Delete Screenshot',
      description: `Are you sure you want to delete ${isCollection ? 'the collection' : 'the screenshot'} "${screenshotTitle}"? ${isCollection ? 'All screenshots in this collection will be deleted.' : ''} This action cannot be undone.`,
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }))
          if (isCollection) {
            await apiClient.deleteCollection(screenshotId)
          } else {
            await apiClient.deleteScreenshot(screenshotId)
          }
          
          // Remove the deleted item from local state instead of reloading
          setScreenshots(prev => prev.filter(item => (item._id || item.id) !== screenshotId))
          
          // Also remove any associated image URLs to prevent memory leaks
          setImageUrls(prev => {
            const updated = { ...prev }
            delete updated[screenshotId]
            // If it's a collection, also remove frame image URLs
            if (isCollection) {
              const deletedItem = screenshots.find(s => (s._id || s.id) === screenshotId)
              if (deletedItem?.frames) {
                deletedItem.frames.forEach(frame => {
                  if (frame._id) {
                    delete updated[frame._id]
                  }
                })
              }
            }
            return updated
          })
          
          toast.success(`${isCollection ? 'Collection' : 'Screenshot'} deleted successfully`)
        } catch (error) {
          console.error(`Failed to delete ${isCollection ? 'collection' : 'screenshot'}:`, error)
          toast.error(`Failed to delete ${isCollection ? 'collection' : 'screenshot'}`)
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }))
        }
      }
    })
  }

  // handleDeleteProject removed - delete functionality only available in project list grid

  // New handler functions
  const handleViewImage = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot)
    setShowFullImage(true)
  }

  const handleViewCollection = (collection: Screenshot) => {
    setSelectedCollection(collection)
    setShowCollectionFrames(true)
  }

  const handleDownloadImage = async (screenshot: Screenshot) => {
    if (!screenshot._id) return
    
    try {
      if (!token) {
        toast.error('Authentication required')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${screenshot._id}?type=full`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${screenshot.title || 'screenshot'}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Image downloaded successfully')
      } else {
        toast.error('Failed to download image')
      }
    } catch (error) {
      console.error('Failed to download image:', error)
      toast.error('Failed to download image')
    }
  }

  const handleDownloadCollection = async (collection: Screenshot) => {
    if (!collection.collectionInfo?.id) return
    
    try {
      const blob = await apiClient.downloadCollection(collection.collectionInfo.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${collection.collectionInfo.name || 'collection'}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Collection downloaded successfully')
    } catch (error) {
      console.error('Failed to download collection:', error)
      toast.error('Failed to download collection')
    }
  }

  const handleProjectPDF = () => {
    setShowPDFConfig(true)
  }

  const handleCollectionPDF = (collection: Screenshot) => {
    setSelectedCollection(collection)
    setShowPDFConfig(true)
  }

  const handleGeneratePDF = async (config: any, type: 'collection' | 'project', id?: string) => {
    try {
      let blob: Blob
      let filename: string
      
      if (type === 'collection' && id) {
        blob = await apiClient.generateCollectionPDF(id, config)
        const collection = screenshots.find(s => s.collectionInfo?.id === id)
        filename = `${collection?.collectionInfo?.name || 'collection'}.pdf`
      } else {
        if (!project) {
          toast.error('Project not found')
          return
        }
        blob = await apiClient.generateProjectPDF(project.id, config)
        filename = `${project.name}.pdf`
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleViewFrame = (frame: Screenshot) => {
    setSelectedScreenshot(frame)
    setShowFullImage(true)
  }

  if (!token || !user || loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }



  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAddScreenshot = async (data: any) => {

    try {
      if (data.mode === 'crawl') {
        if (data.selectedUrls && data.collectionId) {
          // New crawl workflow - URLs already selected and capture started
          // Just refresh the data to show the new collection
          loadProjectData(data.projectId)
        } else {
          // Old crawl workflow - create crawl screenshot collection
          const newCollection = await apiClient.createCrawlScreenshot(data.url, data.projectId)
          // Refresh the data to get the new collection in the unified screenshots array
          loadProjectData(data.projectId)
          toast.success('Crawl screenshot started successfully')
        }
      } else {

        
        try {
          // Create normal screenshot (with timeFrames if provided)
          const apiResponse = await apiClient.createScreenshot(data.url, data.projectId, data.timeFrames, data.frameOptions?.autoScroll)

          
          // Extract the actual screenshot object from the response
          const newScreenshot = apiResponse.screenshot || apiResponse

          
          if (!newScreenshot || (!newScreenshot._id && !newScreenshot.id)) {
            throw new Error('API returned invalid screenshot object')
          }
          
          // Optimistic UI: Add the new screenshot immediately with loading state
          const optimisticScreenshot = {
            ...newScreenshot,
            // Ensure we have the correct ID fields
            _id: newScreenshot._id || newScreenshot.id,
            id: newScreenshot.id || newScreenshot._id,
            status: 'processing',
            url: data.url,
            createdAt: new Date().toISOString(),
            metadata: { title: 'Loading...', description: '' }
          }

          

          
          setScreenshots(prevScreenshots => {
            const newScreenshots = [optimisticScreenshot, ...prevScreenshots]
            return newScreenshots
          })
          
          // Clear cache to ensure fresh data when socket updates come
          apiClient.clearCache('/projects')
          toast.success('Screenshot capture started successfully')
        } catch (screenshotError) {
          console.error('❌ Error creating screenshot:', screenshotError)
          toast.error('Failed to create screenshot: ' + (screenshotError as Error).message)
          // Don't throw error to allow modal to close
        }
      }
    } catch (error) {
      console.error('Failed to create screenshot:', error)
      toast.error('Failed to start screenshot capture')
    } finally {
      // Always close the modal, even if there's an error
      setShowAddModal(false)
    }
  }

  return (
    <DashboardLayout 
      title={project?.name || 'Loading...'} 
      subtitle={project ? `${screenshots.length} Screenshots • ${screenshots.filter(s => s.isCollectionFolder).length} Collections • Updated ${formatDate(project.updatedAt || project.createdAt)}` : 'Loading project...'}
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center transition-colors duration-200">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
        </div>
        <div className="flex gap-2">
          {/* Delete button removed - only available in project list grid */}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search screenshots and collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 backdrop-blur-xl bg-white/20 border-white/20"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => params.id && loadProjectData(params.id as string)}
            variant="outline"
            className="backdrop-blur-xl bg-white/10 border-orange-200/30 hover:bg-orange-100/20 dark:hover:bg-orange-800/20 text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 rounded-xl px-4 py-2 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleProjectPDF}
            variant="outline"
            className="backdrop-blur-xl bg-white/10 border-red-200/30 hover:bg-red-100/20 dark:hover:bg-red-800/20 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 rounded-xl px-4 py-2 transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Screenshot
          </Button>

        </div>
      </div>

      {/* Socket Connection Status */}
      {isConnected && (
        <div className="mb-4 flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates connected</span>
        </div>
      )}

      {/* Unified Screenshots Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allItems.map((item) => {
          // Check if this item has progress
          const itemId = item._id || item.id || ''
          const itemProgress = item.isCollectionFolder 
            ? (collectionProgress[itemId]?.progress === 100 ? null : collectionProgress[itemId]) 
            : screenshotProgress[itemId]
          
          // Also check if this is a processing screenshot (for optimistic UI)
          const isProcessing = item.status === 'processing'
          

          
          return (
            <div key={`screenshot-${item.id}`}>
            {item.isCollectionFolder ? (
              // Collection Folder Card
              <GlassCard className="hover:scale-105 transition-transform duration-200 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20">
                <GlassCardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                    {itemProgress ? (
                      // Show progress for collections being processed
                      <div className="text-center p-4">
                        <div className="flex items-center justify-center mb-2">
                          {(itemProgress as any).isScrolling ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-bounce h-2 w-2 bg-orange-500 rounded-full"></div>
                              <div className="animate-bounce h-2 w-2 bg-orange-500 rounded-full" style={{animationDelay: '0.1s'}}></div>
                              <div className="animate-bounce h-2 w-2 bg-orange-500 rounded-full" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          ) : (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                          {(itemProgress as any).isScrolling ? (
                            <span className="flex items-center justify-center">
                              <span className="mr-2">🔄</span>
                              Scroll in progress...
                            </span>
                          ) : (
                            itemProgress.stage || 'Processing...'
                          )}
                        </div>
                        <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mb-1">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${itemProgress.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          {'completedScreenshots' in itemProgress ? 
                            `${itemProgress.completedScreenshots || 0} / ${itemProgress.totalScreenshots || 0} completed` :
                            'Processing...'
                          }
                        </div>
                      </div>
                    ) : (
                      // Show normal collection folder
                      <div className="text-center">
                        <FolderOpen className="h-12 w-12 text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          {item.metadata?.screenshotCount || 0} Screenshots
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Status badge at the top */}
                    <div className="flex items-center justify-start">
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        Collection
                      </Badge>
                    </div>
                    
                    {/* Title and action buttons in separate rows */}
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {item.metadata?.title || item.collectionInfo?.name}
                    </h3>
                    
                    {/* Action buttons with more space */}
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedCollection(item as Screenshot)
                          setShowCollectionFrames(true)
                        }}
                        className="hover:bg-orange-100/20 dark:hover:bg-orange-800/20 flex-1"
                        title="View frames"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadCollection(item as Screenshot)}
                        className="hover:bg-orange-100/20 dark:hover:bg-orange-800/20 flex-1"
                        title="Download ZIP"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCollectionPDF(item as Screenshot)}
                        className="hover:bg-orange-100/20 dark:hover:bg-orange-800/20 flex-1"
                        title="Generate PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteScreenshot(item._id || item.id || '', item.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1"
                        title="Delete collection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{item.url}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ) : (
              // Regular Screenshot Card
              <GlassCard className={`hover:scale-105 transition-transform duration-200 ${
                item.isCollection 
                  ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20' 
                  : ''
              }`}>
                <GlassCardContent className="p-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden relative">
                    {/* Always show the image/placeholder first */}
                    {item._id && imageUrls[item._id] ? (
                      <img 
                        src={imageUrls[item._id]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Progress overlay when processing */}
                    {(itemProgress || isProcessing) && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center p-4 text-white">
                          <div className="flex items-center justify-center mb-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                          </div>
                          <div className="text-sm font-medium mb-3">
                            {itemProgress?.stage || 'Processing...'}
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${itemProgress?.progress || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-orange-300">
                            {itemProgress?.progress || 0}%
                          </div>
                          {itemProgress && 'error' in itemProgress && itemProgress.error && (
                            <div className="text-xs text-red-400 mt-2">
                              {itemProgress.error}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Status badge at the top */}
                    <div className="flex items-center justify-start">
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    
                    {/* Action buttons for individual screenshots with more space */}
                    {!item.isCollectionFolder && (
                      <div className="flex items-center justify-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewImage(item as Screenshot)}
                          className="flex-1"
                          title="View full image"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadImage(item as Screenshot)}
                          className="flex-1"
                          title="Download image"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteScreenshot(item._id || item.id || '', item.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1"
                          title="Delete screenshot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{item.url}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
          )
        })}
      </div>

      {/* Empty State */}
      {allItems.length === 0 && (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No items found' : 'No screenshots yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Add your first screenshot to get started'
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Your First Screenshot
            </Button>
          )}
        </div>
      )}



      {/* Collection Frames Modal */}
      {selectedCollection && selectedCollection.frames && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {selectedCollection.metadata?.title || selectedCollection.collectionInfo?.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedCollection.frames.length} screenshots
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCollection(null)}
                  className="hover:bg-white/10"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {selectedCollection.frames.map((frame) => (
                  <div key={frame._id} className="group">
                    <GlassCard className="hover:scale-105 transition-all duration-300 hover:shadow-xl">
                      <GlassCardContent className="p-4">
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl mb-4 overflow-hidden">
                          {frame._id && imageUrls[frame._id] ? (
                            <img 
                              src={imageUrls[frame._id]}
                              alt={frame.metadata?.title || frame.url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 flex items-center justify-center">
                              <Camera className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {frame.metadata?.title || 'Untitled'}
                          </h4>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <Globe className="h-3 w-3" />
                            <span className="truncate">{frame.url}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(frame.createdAt)}</span>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewFrame(frame)}
                                title="View full image"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadImage(frame)}
                                title="Download image"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Screenshot Modal */}
      <AddScreenshotModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddScreenshot}
        projectId={params.id ? params.id as string : ''}
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

      {/* Full Image Modal */}
      <FullImageModal
        isOpen={showFullImage}
        onClose={() => {
          setShowFullImage(false)
          setSelectedScreenshot(null)
        }}
        screenshot={selectedScreenshot}
        imageUrl={selectedScreenshot?._id ? imageUrls[selectedScreenshot._id] : undefined}
      />

      {/* Collection Frames Modal */}
      <CollectionFramesModal
        isOpen={showCollectionFrames}
        onClose={() => {
          setShowCollectionFrames(false)
          setSelectedCollection(null)
        }}
        collection={selectedCollection as any}
        imageUrls={imageUrls}
        onGenerate={handleGeneratePDF}
        token={token}
      />

      {/* PDF Config Modal */}
      <PDFConfigModal
        isOpen={showPDFConfig}
        onClose={() => {
          setShowPDFConfig(false)
          setSelectedCollection(null)
        }}
        project={selectedCollection ? undefined : project}
        collection={selectedCollection ? { 
          id: selectedCollection.collectionInfo?.id || '', 
          name: selectedCollection.collectionInfo?.name || selectedCollection.title || 'Collection'
        } as any : undefined}
        type={selectedCollection ? "collection" : "project"}
        onGenerate={handleGeneratePDF}
      />
    </DashboardLayout>
  )
}

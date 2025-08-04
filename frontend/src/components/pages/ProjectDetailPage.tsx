import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Camera, 
  Archive, 
  Download, 
  Trash2, 
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DashboardLayout } from '../layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { AddScreenshotModal } from '../modals/AddScreenshotModal'
import { FullImageModal } from '../modals/FullImageModal'
import { CollectionFramesModal } from '../modals/CollectionFramesModal'
import { PDFConfigModal } from '../modals/PDFConfigModal'
import { apiClient } from '../../lib/api'
import { useSocket } from '../../hooks/useSocket'

// Enhanced Screenshot interface that works with both backend and modal components
interface Screenshot {
  id?: string
  _id?: string
  title?: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | string
  type?: string
  metadata?: {
    title?: string
    description?: string
    timestamp?: string
    isCollection?: boolean // Added to support collection flag
    totalFrames?: number // Added to support frame collections
  }
  isFromCollection?: boolean
  collectionId?: string
  frameCount?: number
  createdAt?: string // Added to match modal component expectations
  updatedAt?: string // Added to match modal component expectations
  name?: string // Added to support collection interface
}

interface Project {
  id: string
  name: string
  description?: string
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Debug logs
  useEffect(() => {
    console.log('🔍 Route parameter ID:', id)
    console.log('🔍 Route parameter type:', typeof id)
  }, [id])
  
  // Debug component re-renders
  useEffect(() => {
    console.log('🔄 Component re-rendered. State:', {
      screenshotsCount: screenshots.length,
      loading,
      socketConnected: isConnected,
      collectionProgressCount: Object.keys(collectionProgress).length,
      screenshotProgressCount: Object.keys(screenshotProgress).length
    })
  })
  
  // State
  const [project, setProject] = useState<Project | null>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [showCollectionFrames, setShowCollectionFrames] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Screenshot | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfCollection, setPdfCollection] = useState<Screenshot | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [screenshotToDelete, setScreenshotToDelete] = useState<Screenshot | null>(null)



  // Cleanup socket listeners and blob URLs on unmount
  useEffect(() => {
    return () => {
    }
  }, [id])

  // Debug project data
  useEffect(() => {
    if (project) {
      console.log('🎯 Project data for modal:', { id: project.id, project })
    }
  }, [project])

  // Cleanup blob URLs on unmount memory leaks
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // Use socket hook with progress tracking
  const { 
    isConnected, 
    screenshotProgress, 
    collectionProgress, 
    clearScreenshotProgress, 
    clearCollectionProgress 
  } = useSocket()

  // Debug socket progress data
  useEffect(() => {
    console.log('🔌 Socket Connection Status:', isConnected)
    console.log('📊 Screenshot Progress Data:', screenshotProgress)
    console.log('📚 Collection Progress Data:', collectionProgress)
    console.log('📊 Screenshot Progress Count:', Object.keys(screenshotProgress).length)
    console.log('📚 Collection Progress Count:', Object.keys(collectionProgress).length)
  
    // Debug collection progress details and filter out incomplete data
    Object.entries(collectionProgress).forEach(([id, progress]) => {
      console.log('🔍 Collection Progress Detail:', {
        id,
        type: progress.type,
        stage: progress.stage,
        progress: progress.progress,
        url: progress.url,
        hasType: !!progress.type,
        hasUrl: !!progress.url,
        isComplete: !!progress.type && !!progress.url
      })
    })
  }, [isConnected, screenshotProgress, collectionProgress])

  // Clean up optimistic updates when real data comes in
  useEffect(() => {
    // Remove optimistic updates when real screenshot progress starts
    Object.keys(screenshotProgress).forEach((screenshotId) => {
      // Remove any temp optimistic updates for this URL
      setScreenshots(prev => prev.filter(screenshot => {
        const isOptimistic = screenshot._id?.toString().startsWith('temp-')
        if (isOptimistic) {
          console.log('🧹 Removing optimistic update:', screenshot._id, 'for real screenshot:', screenshotId)
          return false
        }
        return true
      }))
    })
    
    // Same for collections
    Object.keys(collectionProgress).forEach((collectionId) => {
      setScreenshots(prev => prev.filter(screenshot => {
        const isOptimistic = screenshot._id?.toString().startsWith('temp-collection-')
        if (isOptimistic) {
          console.log('🧹 Removing optimistic collection:', screenshot._id, 'for real collection:', collectionId)
          return false
        }
        return true
      }))
    })
  }, [screenshotProgress, collectionProgress])

  // Handle socket progress events - NO API CALLS, purely socket-based updates
  useEffect(() => {
    // Handle screenshot completion - add completed screenshot to main list
    Object.values(screenshotProgress).forEach(async (progress) => {
      if (progress.status === 'completed') {
        console.log('Screenshot completed (socket only):', progress.screenshotId)
        
        // Try to update existing screenshot first
        const existingFound = updateItemStatus(progress.screenshotId, 'completed')
        
        // If no existing screenshot found, create it from socket data to avoid API call and flickering
        if (!existingFound) {
          console.log('No existing screenshot found, creating from socket data:', progress.screenshotId)
          
          // Create screenshot object from socket progress data
          const completedScreenshot = {
            _id: progress.screenshotId,
            id: progress.screenshotId,
            url: progress.url || 'Unknown URL', // Use URL from socket event
            status: 'completed' as const,
            imagePath: progress.imagePath,
            thumbnailPath: progress.thumbnailPath,
            title: progress.metadata?.title || 'Screenshot',
            type: progress.type, // Add type from socket data
            collectionId: progress.collectionId, // Add collectionId from socket data
            metadata: {
              title: progress.metadata?.title || 'Screenshot',
              width: progress.metadata?.width,
              height: progress.metadata?.height,
              fileSize: progress.metadata?.fileSize,
              capturedAt: progress.metadata?.capturedAt || new Date().toISOString(),
              timestamp: progress.createdAt || new Date().toISOString() // Use actual creation date
            },
            createdAt: progress.createdAt || new Date().toISOString(), // Use actual creation date
            updatedAt: new Date().toISOString()
          }
          
          // Remove any optimistic/temp entries and add the completed screenshot
          setScreenshots(prev => {
            const withoutTemp = prev.filter(s => {
              const id = (s.id || s._id)?.toString()
              return !id?.startsWith('temp-')
            })
            
            // Add the completed screenshot at the beginning (most recent first)
            return [completedScreenshot, ...withoutTemp]
          })
          
          // Load thumbnail for the new screenshot if available
          if (completedScreenshot.thumbnailPath) {
            loadImageUrls([completedScreenshot])
          }
          
          console.log('✅ Added completed screenshot to grid from socket data:', progress.screenshotId)
        }
        
        // Clear progress data after a delay
        setTimeout(() => {
          clearScreenshotProgress(progress.screenshotId)
        }, 2000) // Keep progress visible for 2 seconds after completion
      }
    })
  }, [screenshotProgress, clearScreenshotProgress])

  useEffect(() => {
    // Handle collection completion - just clear progress data, no API calls
    Object.values(collectionProgress).forEach((progress) => {
      // Only consider collection complete if:
      // 1. Progress is 100% AND
      // 2. Not currently scrolling (isScrolling is false or undefined) AND
      // 3. Stage doesn't indicate ongoing work
      const isActuallyComplete = progress.progress >= 100 && 
                                !progress.isScrolling && 
                                !progress.stage?.includes('Starting') &&
                                !progress.stage?.includes('Scrolling')
      
      if (isActuallyComplete) {
        console.log('Collection actually completed (socket only):', progress.collectionId, progress.stage)
        
        // Update collection status locally to avoid flickering and remove "Processing" badge
        updateItemStatus(progress.collectionId, 'completed')
        
        // Clear progress data after a delay
        setTimeout(() => {
          clearCollectionProgress(progress.collectionId)
        }, 2000) // Keep progress visible for 2 seconds after completion
      }
    })
  }, [collectionProgress, clearCollectionProgress])

  // Update screenshot/collection status locally to avoid flickering
  const updateItemStatus = (itemId: string, status: 'processing' | 'completed' | 'failed'): boolean => {
    let found = false
    setScreenshots(prev => prev.map(screenshot => {
      const screenshotId = (screenshot.id || screenshot._id)?.toString()
      if (screenshotId === itemId) {
        found = true
        return {
          ...screenshot,
          status,
          updatedAt: new Date().toISOString()
        }
      }
      return screenshot
    }))
    return found
  }

  // Fetch project data including screenshots and collections
  const fetchScreenshots = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const projectData = await apiClient.getProject(id)
      
      // Combine screenshots and collections into a single array
      const allItems = [
        ...(projectData.screenshots || []),
        ...(projectData.collections || [])
      ]
      
      setScreenshots(allItems)
      setProject(projectData)
      
      // Automatically load thumbnails for individual screenshots
      const individualScreenshots = allItems.filter(item => 
        item.type !== 'collection'
      )
      if (individualScreenshots.length > 0) {
        loadImageUrls(individualScreenshots)
      }
    } catch (error) {
      console.error('Error fetching project data:', error)
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  // Load image URLs for thumbnails using blob URLs with proper auth
  const loadImageUrls = async (screenshotsToLoad: Screenshot[]) => {
    const newUrls: Record<string, string> = {}
    
    for (const screenshot of screenshotsToLoad) {
      const screenshotId = screenshot.id || screenshot._id
      if (!screenshotId || imageUrls[screenshotId]) continue
      
      // Only load images for individual screenshots (not collections)
      const isCollection = screenshot.type === 'collection'
      if (isCollection) continue
      
      try {
        const imageUrl = await apiClient.getImageUrl(screenshotId)
        newUrls[screenshotId] = imageUrl
        console.log('✅ Successfully loaded image for:', screenshotId)
      } catch (error) {
        console.error('Error loading image for', screenshotId, ':', error)
      }
    }
    
    if (Object.keys(newUrls).length > 0) {
      setImageUrls(prev => ({ ...prev, ...newUrls }))
    }
  }

  // Handle add screenshot
  const handleAddScreenshot = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Handle different types of screenshot creation
      if (data.mode === 'crawl' && data.collectionId) {
        // This is a crawl collection - collection already created, just close modal
        toast.success(`Started capturing ${data.selectedUrls?.length || 0} screenshots`)
        setShowAddModal(false)
        
        // Add optimistic collection update for immediate UI feedback
        const newCollection: Screenshot = {
          _id: data.collectionId,
          id: data.collectionId,
          url: data.url,
          status: 'processing',
          title: `Crawl of ${data.url}`,
          type: 'collection',
          isFromCollection: true,
          collectionId: data.collectionId,
          frameCount: data.selectedUrls?.length || 0,
          metadata: {
            title: `Crawl of ${data.url}`,
            timestamp: new Date().toISOString(),
            isCollection: true,
            totalFrames: data.selectedUrls?.length || 0
          }
        }
        
        setScreenshots(prev => [newCollection, ...prev])
        console.log('Collection created, waiting for socket updates...', data.collectionId)
      } else {
        // Check if this is a frame screenshot (has timeFrames)
        const isFrameScreenshot = data.timeFrames && Array.isArray(data.timeFrames) && data.timeFrames.length > 1
        
        if (isFrameScreenshot) {
          // Frame screenshots create collections - handle like crawl collections
          const response = await apiClient.createScreenshot(data.url, id!, data.timeFrames, data.options)
          toast.success('Frame screenshot request submitted!')
          setShowAddModal(false)
          
          // Create optimistic collection for frame screenshots
          const newCollection = {
            _id: response.collection?.id || `temp-collection-${Date.now()}`,
            type: 'collection',
            isFromCollection: true,
            frameCount: data.timeFrames.length,
            url: data.url,
            title: data.title || `Frame Screenshots - ${new URL(data.url).hostname}`,
            metadata: { 
              title: data.title || `Frame Screenshots - ${new URL(data.url).hostname}`,
              isCollection: true,
              type: 'frame',
              frameCount: data.timeFrames.length,
              timeFrames: data.timeFrames
            },
            status: 'processing' as const
          } as Screenshot
          
          setScreenshots(prev => [newCollection, ...prev])
          console.log('Frame collection created, waiting for socket updates...', response.collection?.id)
        } else {
          // Regular single screenshot creation
          await apiClient.createScreenshot(data.url, id!, data.timeFrames, data.options)
          toast.success('Screenshot request submitted!')
          setShowAddModal(false)
          
          // Add optimistic update for immediate UI feedback
          const newScreenshot: Screenshot = {
            _id: `temp-${Date.now()}`,
            url: data.url,
            status: 'pending',
            title: data.title || data.url,
            metadata: {
              title: data.title || data.url,
              timestamp: new Date().toISOString()
            }
          }
          
          setScreenshots(prev => [newScreenshot, ...prev])
          console.log('Screenshot created, waiting for socket updates...')
        }
      }
    } catch (error) {
      console.error('Error adding screenshot:', error)
      toast.error('Failed to add screenshot')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view image
  const handleViewImage = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot)
    setShowFullImage(true)
  }

  // Load collection screenshots for thumbnail display
  const loadCollectionScreenshots = async (collectionId: string) => {
    try {
      console.log('Loading collection screenshots for:', collectionId)
      const response = await apiClient.getCollectionScreenshots(collectionId)
      console.log('Collection screenshots API response:', response)
      
      // Extract screenshots array from response (handle different response structures)
      const collectionScreenshots = Array.isArray(response) ? response : 
                                   (response.screenshots || response.data || [])
      
      if (!Array.isArray(collectionScreenshots)) {
        console.warn('Collection screenshots response is not an array:', response)
        return
      }
      
      console.log(`Found ${collectionScreenshots.length} screenshots in collection`)
      
      // Load thumbnails for all screenshots in the collection
      const newUrls: Record<string, string> = {}
      
      for (const screenshot of collectionScreenshots) {
        const screenshotId = screenshot.id || screenshot._id
        if (!screenshotId || imageUrls[screenshotId]) continue
        
        try {
          const imageUrl = await apiClient.getImageUrl(screenshotId)
          newUrls[screenshotId] = imageUrl
        } catch (error) {
          console.error(`Failed to load thumbnail for ${screenshotId}:`, error)
        }
      }
      
      // Update imageUrls state with new collection thumbnails
      if (Object.keys(newUrls).length > 0) {
        console.log(`Loaded ${Object.keys(newUrls).length} thumbnails for collection`)
        setImageUrls(prev => ({ ...prev, ...newUrls }))
      } else {
        console.log('No new thumbnails to load')
      }
    } catch (error) {
      console.error('Failed to load collection screenshots:', error)
    }
  }

  // Handle view collection
  const handleViewCollection = async (collection: Screenshot) => {
    setSelectedCollection(collection)
    setShowCollectionFrames(true)
    
    // Load collection screenshots for thumbnail display
    const collectionId = collection.id || collection._id
    if (collectionId) {
      await loadCollectionScreenshots(collectionId)
    }
  }

  // Handle delete screenshot/collection - show modal
  const handleDeleteScreenshot = (screenshot: Screenshot) => {
    setScreenshotToDelete(screenshot)
    setShowDeleteModal(true)
  }

  // Confirm delete screenshot or collection
  const confirmDeleteScreenshot = async () => {
    if (!screenshotToDelete) return
    
    const itemId = screenshotToDelete.id || screenshotToDelete._id
    if (!itemId) return
    
    // Check if this is a collection
    const isCollection = screenshotToDelete.isFromCollection || 
                        screenshotToDelete.type === 'collection' || 
                        (screenshotToDelete.frameCount && screenshotToDelete.frameCount > 1) ||
                        (screenshotToDelete.metadata as any)?.isCollection ||
                        (screenshotToDelete as any).name !== undefined
    
    try {
      if (isCollection) {
        await apiClient.deleteCollection(id!, itemId)
        toast.success('Collection deleted')
      } else {
        await apiClient.deleteScreenshot(id!, itemId)
        toast.success('Screenshot deleted')
      }
      
      // Update local state instead of API refresh
      setScreenshots(prev => prev.filter(s => (s.id || s._id) !== itemId))
      setShowDeleteModal(false)
      setScreenshotToDelete(null)
    } catch (error) {
      console.error(`Error deleting ${isCollection ? 'collection' : 'screenshot'}:`, error)
      toast.error(`Failed to delete ${isCollection ? 'collection' : 'screenshot'}`)
    }
  }

  // Handle generate PDF
  const handleGeneratePDF = async (config: any) => {
    if (!pdfCollection) return
    
    try {
      const collectionId = pdfCollection.id || pdfCollection._id
      if (!collectionId) {
        toast.error('Collection ID not found')
        return
      }
      const pdfData = await apiClient.generateCollectionPDF(collectionId, config)
      
      const url = window.URL.createObjectURL(new Blob([pdfData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${pdfCollection.title || 'collection'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF generated successfully!')
      setShowPDFModal(false)
      setPdfCollection(null)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  // Handle download collection as ZIP
  const handleDownloadZip = async (collection: Screenshot) => {
    const collectionId = collection.id || collection._id
    if (!collectionId) {
      toast.error('Collection ID not found')
      return
    }
    
    try {
      const zipData = await apiClient.downloadCollectionZip(collectionId)
      
      const url = window.URL.createObjectURL(new Blob([zipData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${collection.title || 'collection'}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('ZIP downloaded successfully!')
    } catch (error) {
      console.error('Error downloading ZIP:', error)
      toast.error('Failed to download ZIP')
    }
  }

  // Memoized filtered screenshots
  const filteredScreenshots = useMemo(() => {
    if (!Array.isArray(screenshots)) return []
    
    // Get list of active collection IDs
    const activeCollectionIds = Object.keys(collectionProgress).filter(id => 
      collectionProgress[id].progress < 100
    )
    
    console.log('🔍 Filtering screenshots:', {
      totalScreenshots: screenshots.length,
      activeCollectionIds,
      collectionProgressCount: Object.keys(collectionProgress).length,
      collectionProgress: Object.keys(collectionProgress).map(id => ({
        id,
        progress: collectionProgress[id].progress,
        type: collectionProgress[id].type
      }))
    })
    
    // Remove duplicates first by using a Map with unique IDs
    const uniqueScreenshots = Array.from(
      new Map(screenshots.map(screenshot => [
        (screenshot.id || screenshot._id)?.toString(),
        screenshot
      ])).values()
    )
    
    console.log('🔍 Deduplication results:', {
      originalCount: screenshots.length,
      uniqueCount: uniqueScreenshots.length,
      duplicatesRemoved: screenshots.length - uniqueScreenshots.length
    })
    
    return uniqueScreenshots
      .filter(screenshot => {
        const screenshotId = (screenshot.id || screenshot._id)?.toString()
        
        // Debug: Log each screenshot being processed
        console.log('🔍 Processing screenshot:', {
          id: screenshotId,
          url: screenshot.url,
          title: screenshot.title,
          collectionId: screenshot.collectionId?.toString(),
          type: screenshot.type,
          isFromCollection: screenshot.isFromCollection,
          frameCount: screenshot.frameCount,
          hasCollectionId: !!screenshot.collectionId
        })
        
        // Hide collections that have active progress (show progress card instead)
        if (screenshotId && Object.keys(collectionProgress).some(progressId => 
          progressId === screenshotId && collectionProgress[progressId].progress < 100
        )) {
          console.log('🚫 Hiding collection with active progress:', {
            screenshotId,
            progress: collectionProgress[screenshotId]?.progress
          })
          return false
        }
        
        // Hide individual screenshots that belong to collections (but NOT the collections themselves)
        const currentScreenshotId = (screenshot.id || screenshot._id)?.toString()
        const screenshotCollectionId = screenshot.collectionId?.toString()
        
        // If this screenshot has a collectionId AND it's different from its own ID,
        // then it's an individual screenshot that belongs to a collection - hide it
        if (screenshotCollectionId && screenshotCollectionId !== currentScreenshotId) {
          console.log('🚫 Hiding individual screenshot from collection:', {
            screenshotId: currentScreenshotId,
            collectionId: screenshotCollectionId,
            url: screenshot.url
          })
          return false
        }
        
        // Only hide screenshots that explicitly belong to collections (not standalone screenshots)
        // Individual screenshots added by users should always be visible
        if (screenshotCollectionId && screenshotCollectionId !== currentScreenshotId) {
          console.log('🚫 Hiding collection frame screenshot:', {
            screenshotId: currentScreenshotId,
            collectionId: screenshotCollectionId,
            url: screenshot.url
          })
          return false
        }
        
        // Apply search filter
        if (!searchTerm) return true
        const title = screenshot.title?.toLowerCase() || screenshot.metadata?.title?.toLowerCase() || ''
        const url = screenshot.url?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        return title.includes(search) || url.includes(search)
      })
      .sort((a, b) => {
        // First priority: Completed items (both collections and screenshots) at the top
        const aCompleted = a.status === 'completed'
        const bCompleted = b.status === 'completed'
        
        if (aCompleted && !bCompleted) return -1  // a goes first
        if (!aCompleted && bCompleted) return 1   // b goes first
        
        // Second priority: Sort by updated date (for completed items) or creation date
        const dateA = new Date(a.updatedAt || a.createdAt || 0)
        const dateB = new Date(b.updatedAt || b.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
  }, [screenshots, searchTerm, collectionProgress, screenshotProgress])

  // Effects
  useEffect(() => {
    fetchScreenshots()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout title="Project Not Found" subtitle="The requested project could not be found">
        <div className="text-center py-12">
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={project.name} 
      subtitle={project.description || 'Project screenshots and collections'}
    >
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Socket Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span>{isConnected ? 'Live updates connected' : 'Disconnected'}</span>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Screenshot
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search screenshots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>


        
        {/* Streamlined Empty State */}
        {filteredScreenshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/20">
                <Camera className="h-12 w-12 text-indigo-400 mx-auto" />
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
              {searchTerm ? 'No results found' : 'Start capturing screenshots'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-center">
              {searchTerm 
                ? 'Try different search terms or clear your filters'
                : 'Create individual screenshots or collections to get started'
              }
            </p>
            
            {!searchTerm && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Screenshot
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Show processing collections FIRST - at the beginning of the grid */}
            {Object.values(collectionProgress)
              .filter(progress => progress.progress < 100)
              .sort((a, b) => {
                // Sort by start time - most recent first
                const dateA = new Date(a.startTime || 0)
                const dateB = new Date(b.startTime || 0)
                return dateB.getTime() - dateA.getTime()
              })
              .map((progress) => (
                <div
                  key={progress.collectionId}
                  className="group relative overflow-hidden rounded-2xl bg-purple-50 dark:bg-purple-900/20 backdrop-blur-2xl shadow-xl border border-purple-200 dark:border-purple-800 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent"></div>
                  
                  {/* Progress Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                        <span>{progress.progress || 0}% - {progress.stage || 'Processing'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Processing Preview */}
                  <div className="relative h-48 bg-purple-100 dark:bg-purple-800 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-purple-600 mx-auto mb-4"></div>
                      <p className="text-purple-700 dark:text-purple-300 font-medium">
                        {progress.type === 'crawl' ? 'Crawling in Progress...' : 
                         progress.type === 'frame' ? 'Processing Frame Collection...' : 
                         progress.stage?.includes('crawl') || progress.stage?.includes('Crawl') ? 'Crawling in Progress...' :
                         progress.stage?.includes('frame') || progress.stage?.includes('Frame') || progress.stage?.includes('captures') ? 'Processing Frame Collection...' :
                         'Processing Collection...'}
                      </p>
                      <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">{progress.stage || 'Processing...'}</p>
                      {progress.url && (
                        <p className="text-purple-500 dark:text-purple-400 text-xs mt-1 truncate">
                          {progress.url}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Processing Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {progress.type === 'crawl' ? 'Crawl Collection' : 
                           progress.type === 'frame' ? 'Frame Collection' : 
                           progress.stage?.includes('crawl') || progress.stage?.includes('Crawl') ? 'Crawl Collection' :
                           progress.stage?.includes('frame') || progress.stage?.includes('Frame') || progress.stage?.includes('captures') ? 'Frame Collection' :
                           'Collection'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {progress.stage || `${progress.completedScreenshots || 0} of ${progress.totalScreenshots || 0} screenshots`}
                        </p>
                        {progress.url && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                            {progress.url}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                          {progress.progress || 0}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {/* Show processing screenshots SECOND - individual screenshot progress cards */}
            {Object.values(screenshotProgress)
              .filter(progress => progress.status === 'processing')
              .filter(progress => !filteredScreenshots.find(s => (s.id || s._id) === progress.screenshotId))
              .filter(() => !Object.values(collectionProgress).some(cp => cp.progress < 100)) // Hide when collections active
              .map((progress) => (
                <div
                  key={progress.screenshotId}
                  className="group relative overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-900/20 backdrop-blur-2xl shadow-xl border border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent"></div>
                  
                  {/* Progress Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                        <span>{progress.progress}% - {progress.stage}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Processing Preview */}
                  <div className="relative h-48 bg-blue-100 dark:bg-blue-800 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-300 border-t-blue-600 mx-auto mb-4"></div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">Processing Screenshot...</p>
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">{progress.stage}</p>
                    </div>
                  </div>
                  
                  {/* Processing Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          Processing Screenshot...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          ID: {progress.screenshotId}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                          {progress.progress}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {/* Show existing screenshots LAST */}
            {filteredScreenshots.map((screenshot) => {
              const screenshotId = screenshot.id || screenshot._id
              
              // Improved collection detection - check multiple possible fields
              const isCollection = screenshot.isFromCollection || 
                                 screenshot.type === 'collection' || 
                                 (screenshot.frameCount && screenshot.frameCount > 1) ||
                                 (screenshot.metadata as any)?.isCollection ||
                                 (screenshot as any).name !== undefined
              
              // Collection detection logic
              
              return (
                <div
                  key={screenshotId}
                  className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200/60 dark:hover:border-blue-700/60"
                >
                  {/* Professional Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-transparent dark:from-slate-700/20"></div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-100/20 to-transparent dark:from-blue-900/20 rounded-full blur-xl group-hover:from-blue-200/30 dark:group-hover:from-blue-800/30 transition-all duration-300"></div>
                  
                  {/* Status Badge - Only show for completed, failed, or pending without socket progress */}
                  {(() => {
                    // Check for active socket progress
                    const progress = screenshotProgress[screenshotId!]
                    const collectionId = isCollection ? screenshotId : screenshot.collectionId
                    const collProgress = collectionId ? collectionProgress[collectionId] : null
                    
                    // Check if there are any active collections being processed
                    const hasActiveCollections = Object.values(collectionProgress).some(cp => cp.progress < 100)
                    
                    // AGGRESSIVE: Hide ALL individual progress when collections are active
                    // This ensures only collection progress cards show, no individual indicators
                    if (hasActiveCollections) {
                      return null
                    }
                    
                    // Don't show any indicators if there's active socket progress for this specific item
                    if (progress?.status === 'processing' || (collProgress && collProgress.progress < 100)) {
                      return null
                    }
                    
                    // Only show status badge for non-completed items without active progress
                    if (screenshot.status !== 'completed') {
                      return (
                        <div className="absolute top-4 right-4 z-10">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            screenshot.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : screenshot.status === 'processing'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {screenshot.status === 'processing' && (
                              <div className="flex items-center space-x-1">
                                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                                <span>Processing</span>
                              </div>
                            )}
                            {screenshot.status === 'pending' && 'Pending'}
                            {screenshot.status === 'failed' && 'Failed'}
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })()
                  }
                  
                  {/* Thumbnail/Preview Section */}
                  <div 
                    className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden cursor-pointer"
                    onClick={() => isCollection ? handleViewCollection(screenshot) : handleViewImage(screenshot)}
                    onMouseEnter={() => {
                      // Load image on hover for better UX
                      if (!isCollection && screenshot.status === 'completed' && screenshotId && !imageUrls[screenshotId]) {
                        loadImageUrls([screenshot])
                      }
                    }}
                  >
                    {isCollection ? (
                      // Collection - Show Archive/ZIP Icon
                      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30">
                        <Archive className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-2" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Collection</span>
                      </div>
                    ) : (
                      // Individual Screenshot - Show Thumbnail
                      <div className="relative h-full">
                        {screenshotId && imageUrls[screenshotId] ? (
                          <img
                            src={imageUrls[screenshotId]}
                            alt={screenshot.title || screenshot.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                            <Camera className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Overlay for hover effect */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {screenshot.title || screenshot.metadata?.title || screenshot.url}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                          {screenshot.url}
                        </p>
                      </div>
                      
                      {screenshot.isFromCollection && (
                        <div className="ml-3 flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                          <Archive className="h-3 w-3" />
                          <span>{screenshot.frameCount || 0} frames</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Metadata - Show date for all screenshots */}
                    {(() => {
                      // Try multiple date sources for consistent date display
                      const dateToShow = screenshot.metadata?.timestamp || 
                                       screenshot.createdAt ||
                                       screenshot.updatedAt
                      
                      if (dateToShow) {
                        return (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            {new Date(dateToShow).toLocaleDateString()}
                          </p>
                        )
                      }
                      return null
                    })()}
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isCollection && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadZip(screenshot)
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              ZIP
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPdfCollection(screenshot)
                                setShowPDFModal(true)
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteScreenshot(screenshot)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            
          </div>
        )}
      </div>
      
      {/* Add Screenshot Modal */}
      {id && (
        <AddScreenshotModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddScreenshot}
          projectId={id}
          isLoading={isSubmitting}
        />
      )}
      
      {/* Full Image Modal */}
      <FullImageModal
        isOpen={showFullImage}
        onClose={() => {
          setShowFullImage(false)
          setSelectedScreenshot(null)
        }}
        screenshot={selectedScreenshot as any} // Type assertion to handle modal compatibility
        imageUrl={selectedScreenshot?._id ? imageUrls[selectedScreenshot._id] : undefined}
      />
      
      {/* Collection Frames Modal */}
      <CollectionFramesModal
        isOpen={showCollectionFrames}
        onClose={() => {
          setShowCollectionFrames(false)
          setSelectedCollection(null)
        }}
        collection={selectedCollection as any} // Type assertion to handle modal compatibility
        imageUrls={imageUrls}
        onViewImage={handleViewImage}
      />
      
      {/* PDF Config Modal */}
      <PDFConfigModal
        isOpen={showPDFModal}
        onClose={() => {
          setShowPDFModal(false)
          setPdfCollection(null)
        }}
        collection={pdfCollection as any} // Type assertion to handle modal compatibility
        type="collection"
        onGenerate={handleGeneratePDF}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (() => {
        // Detect if item to delete is a collection
        const isCollection = screenshotToDelete && (
          screenshotToDelete.isFromCollection || 
          screenshotToDelete.type === 'collection' || 
          (screenshotToDelete.frameCount && screenshotToDelete.frameCount > 1) ||
          screenshotToDelete.metadata?.isCollection ||
          screenshotToDelete.name !== undefined
        )
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete {isCollection ? 'Collection' : 'Screenshot'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this {isCollection ? 'collection' : 'screenshot'}? This action cannot be undone.
              </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setScreenshotToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={confirmDeleteScreenshot}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
        )
      })()}
    </DashboardLayout>
  )
}

export default ProjectDetailPage

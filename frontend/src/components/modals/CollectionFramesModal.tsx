import { useState, useCallback } from 'react'
import { X, Download, Eye, Grid, List, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Screenshot {
  id: string
  _id: string
  url: string
  title?: string
  metadata?: {
    title?: string
  }
  status: string
  createdAt: string
  updatedAt: string
  imageUrl?: string
  thumbnailUrl?: string
}

interface Collection {
  id: string
  name: string
  screenshots?: Screenshot[]
  frames?: Screenshot[]
}

interface CollectionFramesModalProps {
  isOpen: boolean
  onClose: () => void
  collection: Collection | null
  imageUrls: Record<string, string>
  onViewImage?: (screenshot: Screenshot) => void
}

export const CollectionFramesModal = ({ 
  isOpen, 
  onClose, 
  collection, 
  imageUrls,
  onViewImage
}: CollectionFramesModalProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [downloading, setDownloading] = useState(false)
  
  const getImageUrl = useCallback((screenshotId: string) => {
    return imageUrls[screenshotId] || null
  }, [imageUrls])

  const handleViewFrame = (frame: Screenshot) => {
    if (onViewImage) {
      onViewImage(frame)
    }
  }

  const handleDownloadFrame = async (frame: Screenshot) => {
    if (!frame._id && !frame.id) return
    
    try {
      const screenshotId = frame._id || frame.id
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
      
      const response = await fetch(`${apiUrl}/images/${screenshotId}?type=full`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${frame.title || frame.metadata?.title || 'screenshot'}.png`
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

  const handleDownloadZip = async () => {
    if (!collection?.id) return

    try {
      setDownloading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
      
      const response = await fetch(`${apiUrl}/collections/${collection.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${collection.name || 'collection'}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Collection downloaded successfully')
      } else {
        toast.error('Failed to download collection')
      }
    } catch (error) {
      console.error('Failed to download collection:', error)
      toast.error('Failed to download collection')
    } finally {
      setDownloading(false)
    }
  }

  if (!isOpen || !collection) return null

  const frames = collection.screenshots || collection.frames || []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Archive className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {collection.name}
              </h2>
              <p className="text-sm text-white/60">
                {frames.length} screenshots
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Download ZIP */}
            <Button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {downloading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Downloading...</span>
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download ZIP
                </>
              )}
            </Button>
            
            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {frames.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No screenshots in this collection
              </h3>
              <p className="text-white/60">
                This collection doesn't contain any screenshots yet.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {frames.map((frame) => {
                const frameId = frame._id || frame.id
                const imageUrl = getImageUrl(frameId)
                
                return (
                  <div
                    key={frameId}
                    className="group relative bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-purple-500/50 transition-all duration-200 overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-800/50 relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={frame.title || frame.metadata?.title || 'Screenshot'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        </div>
                      )}
                      
                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFrame(frame)}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFrame(frame)}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate">
                        {frame.title || frame.metadata?.title || 'Untitled'}
                      </h3>
                      <p className="text-xs text-white/60 truncate mt-1">
                        {frame.url}
                      </p>
                      {frame.createdAt && (
                        <p className="text-xs text-white/50 mt-1">
                          {new Date(frame.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {frames.map((frame) => {
                const frameId = frame._id || frame.id
                const imageUrl = getImageUrl(frameId)
                
                return (
                  <div
                    key={frameId}
                    className="group flex items-center space-x-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-purple-500/50 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-gray-800/50 rounded overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={frame.title || frame.metadata?.title || 'Screenshot'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {frame.title || frame.metadata?.title || 'Untitled'}
                      </h3>
                      <p className="text-xs text-white/60 truncate">
                        {frame.url}
                      </p>
                      {frame.createdAt && (
                        <p className="text-xs text-white/50">
                          {new Date(frame.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFrame(frame)}
                        className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFrame(frame)}
                        className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

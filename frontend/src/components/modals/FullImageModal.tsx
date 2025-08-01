import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Loader2 } from 'lucide-react'
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
  imageUrl?: string
  thumbnailUrl?: string
}

interface FullImageModalProps {
  isOpen: boolean
  onClose: () => void
  screenshot: Screenshot | null
  imageUrl?: string
}

export const FullImageModal = ({ isOpen, onClose, screenshot, imageUrl }: FullImageModalProps) => {
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isOpen && screenshot) {
      loadFullImage()
    } else {
      setFullImageUrl(null)
      setError(false)
    }
  }, [isOpen, screenshot])

  const loadFullImage = async () => {
    if (!screenshot) return

    try {
      setLoading(true)
      setError(false)
      
      const screenshotId = screenshot._id || screenshot.id
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8002/api'
      
      const response = await fetch(`${apiUrl}/images/${screenshotId}?type=full`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setFullImageUrl(url)
      } else {
        setError(true)
        toast.error('Failed to load full image')
      }
    } catch (error) {
      console.error('Failed to load full image:', error)
      setError(true)
      toast.error('Failed to load full image')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!screenshot || !fullImageUrl) return

    try {
      const link = document.createElement('a')
      link.href = fullImageUrl
      link.download = `${screenshot.title || screenshot.metadata?.title || 'screenshot'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Image downloaded successfully')
    } catch (error) {
      console.error('Failed to download image:', error)
      toast.error('Failed to download image')
    }
  }

  const handleOpenOriginal = () => {
    if (screenshot?.url) {
      window.open(screenshot.url, '_blank')
    }
  }

  const handleClose = () => {
    if (fullImageUrl) {
      URL.revokeObjectURL(fullImageUrl)
    }
    onClose()
  }

  if (!isOpen || !screenshot) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-60">
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {screenshot.title || screenshot.metadata?.title || 'Screenshot'}
            </h2>
            <p className="text-sm text-white/60 truncate">
              {screenshot.url}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {/* Download */}
            <Button
              onClick={handleDownload}
              disabled={!fullImageUrl}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {/* Open Original */}
            <Button
              onClick={handleOpenOriginal}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              title="Open original URL"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            {/* Close */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                <p className="text-white/60">Loading full image...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-white/60 mb-4">Failed to load image</p>
                <Button
                  onClick={loadFullImage}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : fullImageUrl ? (
            <div className="flex justify-center">
              <img
                src={fullImageUrl}
                alt={screenshot.title || screenshot.metadata?.title || 'Screenshot'}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxHeight: 'calc(90vh - 160px)' }}
              />
            </div>
          ) : imageUrl ? (
            // Fallback to thumbnail while loading
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt={screenshot.title || screenshot.metadata?.title || 'Screenshot'}
                className="max-w-full max-h-full object-contain rounded-lg opacity-50"
                style={{ maxHeight: 'calc(90vh - 160px)' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-white/60">No image available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

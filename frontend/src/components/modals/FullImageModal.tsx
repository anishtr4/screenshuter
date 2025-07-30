'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Calendar, Globe } from 'lucide-react'
import { Screenshot } from '@/types'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface FullImageModalProps {
  isOpen: boolean
  onClose: () => void
  screenshot: Screenshot | null
  imageUrl?: string
}

export function FullImageModal({ isOpen, onClose, screenshot, imageUrl }: FullImageModalProps) {
  const [loading, setLoading] = useState(false)
  const [fullImageUrl, setFullImageUrl] = useState<string>('')

  useEffect(() => {
    if (isOpen && screenshot && !imageUrl) {
      loadFullImage()
    } else if (imageUrl) {
      setFullImageUrl(imageUrl)
    }
  }, [isOpen, screenshot, imageUrl])

  useEffect(() => {
    // Cleanup blob URL when modal closes
    return () => {
      if (fullImageUrl && fullImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fullImageUrl)
      }
    }
  }, [fullImageUrl])

  const loadFullImage = async () => {
    if (!screenshot?._id) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/images/${screenshot._id}?type=full`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        setFullImageUrl(blobUrl)
      } else {
        toast.error('Failed to load full image')
      }
    } catch (error) {
      console.error('Failed to load full image:', error)
      toast.error('Failed to load full image')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!screenshot?._id || !fullImageUrl) return

    try {
      const link = document.createElement('a')
      link.href = fullImageUrl
      link.download = `${screenshot.title || 'screenshot'}.png`
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 max-w-7xl max-h-[90vh] w-full mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-orange-200/30 dark:border-orange-700/30 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200/30 dark:border-orange-700/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100 truncate">
              {screenshot?.title || 'Screenshot'}
            </h2>
            {screenshot?.url && (
              <p className="text-sm text-orange-600 dark:text-orange-400 truncate mt-1">
                {screenshot.url}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {screenshot?.url && (
              <button
                onClick={handleOpenOriginal}
                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors"
                title="Open original URL"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={handleDownload}
              disabled={!fullImageUrl}
              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors disabled:opacity-50"
              title="Download image"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : fullImageUrl ? (
            <div className="flex justify-center">
              <img
                src={fullImageUrl}
                alt={screenshot?.title || 'Screenshot'}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-orange-600 dark:text-orange-400">
              <p>Failed to load image</p>
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        {screenshot && (
          <div className="border-t border-orange-200/30 dark:border-orange-700/30 p-6 bg-orange-50/50 dark:bg-orange-900/20">
            <div className="flex items-center justify-between text-sm text-orange-600 dark:text-orange-400">
              <div className="flex items-center space-x-4">
                {screenshot.createdAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(screenshot.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                
                {screenshot.metadata?.viewport && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>{screenshot.metadata.viewport.width}×{screenshot.metadata.viewport.height}</span>
                  </div>
                )}
              </div>
              
              {screenshot.metadata?.fileSize && (
                <span className="font-medium">{(screenshot.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

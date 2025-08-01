'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Download, Eye, FileText, Grid, List } from 'lucide-react'
import { Screenshot, Collection } from '@/types'
import { FullImageModal } from './FullImageModal'
import { PDFConfigModal } from './PDFConfigModal'
// Removed useStableImageUrls import - using parent imageUrls instead
import { toast } from 'sonner'

interface CollectionFramesModalProps {
  isOpen: boolean
  onClose: () => void
  collection: (Screenshot & { 
    frames?: Screenshot[]
    name?: string
    collectionInfo?: {
      id: string
      name: string
    }
  }) | null
  imageUrls: Record<string, string>
  onGenerate?: (config: any, type: 'collection' | 'project', id?: string) => Promise<void>
  token?: string
}

export function CollectionFramesModal({ 
  isOpen, 
  onClose, 
  collection, 
  imageUrls,
  onGenerate,
  token
}: CollectionFramesModalProps) {
  const [selectedFrame, setSelectedFrame] = useState<Screenshot | null>(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showPDFConfig, setShowPDFConfig] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [downloading, setDownloading] = useState(false)
  
  // Use the imageUrls passed from parent (which are stable from the main page)
  const getImageUrl = useCallback((screenshotId: string) => {
    return imageUrls[screenshotId] || null
  }, [imageUrls])

  const handleViewFrame = (frame: Screenshot) => {
    setSelectedFrame(frame)
    setShowFullImage(true)
  }

  const handleDownloadFrame = async (frame: Screenshot) => {
    if (!frame._id) return
    
    try {
      if (!token) {
        toast.error('Authentication required')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${frame._id}?type=full`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${frame.title || 'screenshot'}.png`
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
    if (!collection?.frames?.length) return

    try {
      if (!token) {
        toast.error('Authentication required')
        return
      }
      
      setDownloading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${collection.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${collection.name || collection.collectionInfo?.name || collection.title || 'collection'}.zip`
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

  const handleDownloadPDF = () => {
    setShowPDFConfig(true)
  }

  if (!isOpen || !collection) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-200/30 dark:border-orange-700/30 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-orange-200/30 dark:border-orange-700/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                <Grid className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100 truncate">
                  {collection.name || collection.collectionInfo?.name || collection.title || 'Collection'}
                </h2>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {collection.frames?.length || 0} screenshots
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {/* View Mode Toggle */}
              <div className="flex bg-orange-100/50 dark:bg-orange-900/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                      : 'text-orange-700 dark:text-orange-300 hover:bg-orange-200/50 dark:hover:bg-orange-800/30'
                  }`}
                  title="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                      : 'text-orange-700 dark:text-orange-300 hover:bg-orange-200/50 dark:hover:bg-orange-800/30'
                  }`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Download Buttons */}
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Download as PDF"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">PDF</span>
              </button>

              <button
                onClick={handleDownloadZip}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                title="Download as ZIP"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {downloading ? 'Downloading...' : 'ZIP'}
                </span>
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {!collection.frames?.length ? (
              <div className="flex items-center justify-center h-64 text-orange-600 dark:text-orange-400">
                <p>No screenshots in this collection</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {collection.frames.map((frame) => (
                  <div
                    key={frame._id || frame.id}
                    className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-orange-200/30 dark:border-orange-700/30 overflow-hidden hover:border-orange-500/50 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-gray-800/50 relative overflow-hidden">
                      {frame._id && getImageUrl(frame._id) ? (
                        <img
                          src={getImageUrl(frame._id)!}
                          alt={frame.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleViewFrame(frame)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                          title="View full image"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate">
                        {frame.title || 'Untitled'}
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
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {collection.frames.map((frame) => (
                  <div
                    key={frame._id || frame.id}
                    className="group flex items-center space-x-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-orange-500/50 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-gray-800/50 rounded overflow-hidden flex-shrink-0">
                      {frame._id && getImageUrl(frame._id) ? (
                        <img
                          src={getImageUrl(frame._id)!}
                          alt={frame.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {frame.title || 'Untitled'}
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
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleViewFrame(frame)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View full image"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadFrame(frame)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      <FullImageModal
        isOpen={showFullImage}
        onClose={() => {
          setShowFullImage(false)
          setSelectedFrame(null)
        }}
        screenshot={selectedFrame}
        imageUrl={selectedFrame?._id ? getImageUrl(selectedFrame._id) || undefined : undefined}
      />

      {/* PDF Config Modal */}
      <PDFConfigModal
        isOpen={showPDFConfig}
        onClose={() => setShowPDFConfig(false)}
        collection={collection as any}
        type="collection"
        onGenerate={onGenerate!}
      />
    </>
  )
}

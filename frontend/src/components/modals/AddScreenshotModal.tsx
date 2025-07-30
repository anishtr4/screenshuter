'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Camera, 
  X, 
  Globe,
  AlertCircle,
  Search,
  Settings,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

export interface ScreenshotFormData {
  url: string
  projectId: string
  mode: 'normal' | 'crawl' | 'frame'
  options: {
    fullPage: boolean
    width: number
    height: number
    waitTime: number
  }
  crawlOptions?: {
    maxDepth: number
    maxPages: number
    includeExternal: boolean
  }
  frameOptions?: {
    timeFrames: number[]
  }
  // New crawl workflow properties
  selectedUrls?: string[]
  collectionId?: string
}

interface AddScreenshotModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ScreenshotFormData) => void
  projectId: string
  isLoading?: boolean
}

export function AddScreenshotModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projectId,
  isLoading = false 
}: AddScreenshotModalProps) {
  const [formData, setFormData] = useState<ScreenshotFormData>({
    url: '',
    projectId,
    mode: 'normal',
    options: {
      fullPage: true,
      width: 1920,
      height: 1080,
      waitTime: 2000
    },
    crawlOptions: {
      maxDepth: 2,
      maxPages: 10,
      includeExternal: false
    },
    frameOptions: {
      timeFrames: [0, 2, 5] // Default: capture at 0s, 2s, and 5s
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)
  const [crawlStep, setCrawlStep] = useState<'form' | 'discovering' | 'selecting'>('form')
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [collectionId, setCollectionId] = useState<string>('')

  if (!isOpen) return null

  const discoverUrls = async () => {
    setLocalLoading(true)
    setCrawlStep('discovering')
    
    try {
      const data = await apiClient.createCrawlScreenshot(formData.url, formData.projectId)
      setDiscoveredUrls(data.urls || [])
      setSelectedUrls(data.urls || []) // Select all by default
      setCollectionId(data.collection.id)
      setCrawlStep('selecting')
    } catch (error) {
      console.error('Error discovering URLs:', error)
      toast.error('Failed to discover URLs from the website')
      setCrawlStep('form')
    } finally {
      setLocalLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    if (formData.mode === 'crawl' && crawlStep === 'form') {
      // Start URL discovery for crawl mode
      await discoverUrls()
    } else if (formData.mode === 'crawl' && crawlStep === 'selecting') {
      // Submit selected URLs for screenshot capture via /crawl/select endpoint
      try {
        setLocalLoading(true)
        const data = await apiClient.selectCrawlUrls(collectionId, selectedUrls)
        toast.success(`Started capturing ${selectedUrls.length} screenshots`)
        
        // Call parent callback to refresh data
        const crawlData = {
          ...formData,
          selectedUrls,
          collectionId
        }
        onSubmit(crawlData)
        onClose() // Close modal on success
      } catch (error) {
        console.error('Error capturing screenshots:', error)
        toast.error('Failed to start screenshot capture')
      } finally {
        setLocalLoading(false)
      }
    } else {
      // Normal single page screenshot

      onSubmit(formData)

    }
  }
  
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }))
    if (errors.url) {
      setErrors(prev => ({ ...prev, url: '' }))
    }
  }

  const toggleUrlSelection = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    )
  }

  const selectAllUrls = () => {
    setSelectedUrls([...discoveredUrls])
  }

  const deselectAllUrls = () => {
    setSelectedUrls([])
  }

  const goBackToForm = () => {
    setCrawlStep('form')
    setDiscoveredUrls([])
    setSelectedUrls([])
    setCollectionId('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-200/30 dark:border-orange-700/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200/30 dark:border-orange-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                {crawlStep === 'selecting' ? 'Select URLs to Capture' : 
                 crawlStep === 'discovering' ? 'Discovering URLs...' : 
                 'Add Screenshot'}
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {crawlStep === 'selecting' ? `Found ${discoveredUrls.length} pages to capture` :
                 crawlStep === 'discovering' ? 'Crawling website for pages...' :
                 'Capture a screenshot of any webpage'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {crawlStep === 'selecting' ? (
            /* URL Selection View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={selectAllUrls}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Select All ({discoveredUrls.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={deselectAllUrls}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Deselect All
                  </Button>
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  {selectedUrls.length} of {discoveredUrls.length} selected
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2 border border-orange-200/30 dark:border-orange-700/30 rounded-xl p-4">
                {discoveredUrls.map((url, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                      selectedUrls.includes(url)
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-orange-200/50 dark:border-orange-700/50 hover:border-orange-300 dark:hover:border-orange-600"
                    )}
                    onClick={() => toggleUrlSelection(url)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUrls.includes(url)}
                      onChange={() => toggleUrlSelection(url)}
                      className="rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100 truncate">
                        {url}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackToForm}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Back to Settings
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedUrls.length === 0 || isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Capturing Screenshots...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture {selectedUrls.length} Screenshot{selectedUrls.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
                Website URL *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />
                <Input
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "pl-10 px-4 py-3 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-gray-800/50 text-orange-900 dark:text-orange-100 placeholder-orange-500/60 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200",
                    errors.url && "border-red-500"
                  )}
                />
              </div>
              {errors.url && (
                <div className="flex items-center mt-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.url}
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div>
              <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-3 block">
                Capture Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: 'normal' }))}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    formData.mode === 'normal'
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-orange-200/50 dark:border-orange-700/50 hover:border-orange-300 dark:hover:border-orange-600"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className={cn(
                      "h-5 w-5",
                      formData.mode === 'normal' ? "text-orange-600" : "text-orange-400"
                    )} />
                    <span className={cn(
                      "font-medium",
                      formData.mode === 'normal' ? "text-orange-900 dark:text-orange-100" : "text-orange-700 dark:text-orange-300"
                    )}>
                      Single Page
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Capture a screenshot of one specific page
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: 'crawl' }))}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    formData.mode === 'crawl'
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-orange-200/50 dark:border-orange-700/50 hover:border-orange-300 dark:hover:border-orange-600"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Search className={cn(
                      "h-5 w-5",
                      formData.mode === 'crawl' ? "text-orange-600" : "text-orange-400"
                    )} />
                    <span className={cn(
                      "font-medium",
                      formData.mode === 'crawl' ? "text-orange-900 dark:text-orange-100" : "text-orange-700 dark:text-orange-300"
                    )}>
                      Crawl Site
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Discover and capture multiple pages from a website
                  </p>
                </button>
              </div>
            </div>

            {/* Crawl Options */}
            {formData.mode === 'crawl' && (
              <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200/30 dark:border-orange-700/30">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Crawl Settings
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-orange-700 dark:text-orange-300 mb-1 block">
                      Max Depth
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.crawlOptions?.maxDepth || 2}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        crawlOptions: {
                          ...prev.crawlOptions!,
                          maxDepth: parseInt(e.target.value) || 2
                        }
                      }))}
                      className="px-3 py-2 rounded-lg border border-orange-200/50 dark:border-orange-700/50 bg-white/70 dark:bg-gray-800/70 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                    />
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      How deep to crawl (1-5 levels)
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-orange-700 dark:text-orange-300 mb-1 block">
                      Max Pages
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.crawlOptions?.maxPages || 10}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        crawlOptions: {
                          ...prev.crawlOptions!,
                          maxPages: parseInt(e.target.value) || 10
                        }
                      }))}
                      className="px-3 py-2 rounded-lg border border-orange-200/50 dark:border-orange-700/50 bg-white/70 dark:bg-gray-800/70 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                    />
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Maximum pages to capture
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeExternal"
                    checked={formData.crawlOptions?.includeExternal || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      crawlOptions: {
                        ...prev.crawlOptions!,
                        includeExternal: e.target.checked
                      }
                    }))}
                    className="rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="includeExternal" className="text-sm text-orange-700 dark:text-orange-300">
                    Include external links (links to other domains)
                  </label>
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-orange-700 dark:text-orange-300 mb-1 block">Width</label>
                  <Input
                    type="number"
                    value={formData.options.width}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, width: parseInt(e.target.value) || 1920 }
                    }))}
                    className="px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-gray-800/50 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-orange-700 dark:text-orange-300 mb-1 block">Height</label>
                  <Input
                    type="number"
                    value={formData.options.height}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, height: parseInt(e.target.value) || 1080 }
                    }))}
                    className="px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-gray-800/50 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-orange-700 dark:text-orange-300 mb-1 block flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Wait Time (ms)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10000"
                    step="500"
                    value={formData.options.waitTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, waitTime: parseInt(e.target.value) || 2000 }
                    }))}
                    className="px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-gray-800/50 text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="fullPage"
                  checked={formData.options.fullPage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    options: { ...prev.options, fullPage: e.target.checked }
                  }))}
                  className="rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="fullPage" className="text-sm text-orange-700 dark:text-orange-300">
                  Capture full page (scroll to bottom)
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || localLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {(isLoading || localLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {localLoading ? 'Discovering URLs...' : 
                     formData.mode === 'crawl' ? 'Crawling...' : 'Capturing...'}
                  </>
                ) : (
                  <>
                    {formData.mode === 'crawl' ? (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Start Crawl
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Screenshot
                      </>
                    )}
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}

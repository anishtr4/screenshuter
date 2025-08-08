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
  Clock,
  ArrowDown,
  Loader2,
  Shield,
  Key,
  Cookie,
  Code,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  MousePointer,
  Plus,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface ScreenshotFormData {
  url: string
  projectId: string
  mode: 'normal' | 'crawl' | 'frame'
  options: {
    fullPage: boolean
    unsticky?: boolean // Whether to make sticky elements static (true) or keep them sticky (false)
    injectBeforeNavigation?: boolean // When to inject CSS/JS: true = before navigation, false = after navigation
    injectBeforeViewport?: boolean // When to inject JS: true = before viewport is set, false = after viewport is set
    width: number
    height: number
    waitTime: number
    cookiePrevention?: boolean
    deviceScaleFactor?: number
    customCSS?: string
    customJS?: string
  }
  crawlOptions?: {
    maxDepth: number
    maxPages: number
    includeExternal: boolean
  }
  frameOptions?: {
    timeFrames: number[]
    autoScroll: {
      enabled: boolean
      selector: string
      stepSize: number
      interval: number
    }
  }
  // Authentication options
  basicAuth?: {
    username: string
    password: string
  }
  customCookies?: string // JSON string for cookie array
  // Trigger selectors for interactive screenshots
  triggerSelectors?: Array<{
    selector: string
    delay: number
    waitAfter: number
    description?: string
  }>
  // Form automation for multi-step form filling and validation
  formSteps?: Array<{
    stepName: string
    formInputs: Array<{
      selector: string
      value: string
      inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea'
      description?: string
    }>
    submitTrigger?: {
      selector: string
      waitAfter: number
      description?: string
    }
    validationChecks?: Array<{
      selector: string
      expectedText?: string
      checkType: 'exists' | 'text' | 'class' | 'attribute'
      description?: string
    }>
    stepTimeout: number
    takeScreenshotAfterFill: boolean
    takeScreenshotAfterSubmit: boolean
    takeScreenshotAfterValidation: boolean
  }>
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
      unsticky: true, // Default to making sticky elements static
      injectBeforeNavigation: false, // Default to injecting CSS/JS after navigation
      injectBeforeViewport: false, // Default to injecting JS after viewport is set
      width: 1920,
      height: 1080,
      waitTime: 2000,
      cookiePrevention: true,
      deviceScaleFactor: 2,
      customCSS: '',
      customJS: ''
    },
    crawlOptions: {
      maxDepth: 2,
      maxPages: 10,
      includeExternal: false
    },
    frameOptions: {
      timeFrames: [0, 2, 5], // Default: capture at 0s, 2s, and 5s
      autoScroll: {
        enabled: false,
        selector: 'window', // Default to window scroll
        stepSize: 500, // Scroll 500px at a time
        interval: 1000 // Wait 1 second between scrolls
      }
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)
  const [crawlStep, setCrawlStep] = useState<'form' | 'discovering' | 'selecting'>('form')
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [collectionId, setCollectionId] = useState<string>('')
  
  // UI state for collapsible sections
  const [showAuthOptions, setShowAuthOptions] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showPasswordAuth, setShowPasswordAuth] = useState(false)
  const [showTriggerOptions, setShowTriggerOptions] = useState(false)
  const [showFormAutomation, setShowFormAutomation] = useState(false)


  if (!isOpen) return null

  const discoverUrls = async () => {
    setLocalLoading(true)
    setCrawlStep('discovering')
    
    try {
      console.log('🔍 Crawl discovery - URL:', formData.url, 'Project ID:', formData.projectId)
      console.log('🔍 Full formData:', formData)
      console.log('🔍 Prop projectId:', projectId)
      
      // Ensure projectId is not empty
      if (!formData.projectId) {
        console.error('❌ Project ID is missing from formData!')
        toast.error('Project ID is missing. Please try again.')
        setCrawlStep('form')
        return
      }
      
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
        await apiClient.selectCrawlUrls(collectionId, selectedUrls)
        toast.success(`Started capturing ${selectedUrls.length} screenshots`)
        
        // Call parent callback to refresh data
        const crawlData = {
          ...formData,
          selectedUrls,
          collectionId,
          // Include authentication fields
          basicAuth: formData.basicAuth,
          customCookies: formData.customCookies
        }
        onSubmit(crawlData)
        onClose()
      } catch (error) {
        console.error('Error selecting crawl URLs:', error)
        toast.error('Failed to start screenshot capture')
      } finally {
        setLocalLoading(false)
      }
    } else if (formData.mode === 'frame') {
      // Handle frame screenshots through onSubmit so they show in grid with progress
      const frameData = {
        ...formData,
        timeFrames: formData.frameOptions?.timeFrames,
        // Include authentication fields at root level
        basicAuth: formData.basicAuth,
        customCookies: formData.customCookies,
        options: {
          ...formData.options,
          autoScroll: formData.frameOptions?.autoScroll
        }
      }
      
      console.log('🎬 Frame screenshot data being submitted:', frameData)
      onSubmit(frameData)
    } else {
      // Normal single page screenshot - ensure authentication fields are included
      const normalData = {
        ...formData,
        // Explicitly include authentication fields
        basicAuth: formData.basicAuth,
        customCookies: formData.customCookies,
        // Include trigger selectors for interactive screenshots
        triggerSelectors: formData.triggerSelectors,
        // Include form steps for form automation
        formSteps: formData.formSteps
      }
      
      console.log('📸 Normal screenshot data being submitted:', normalData)
      onSubmit(normalData)
    }
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }))
    if (errors.url) setErrors(prev => ({ ...prev, url: '' }))
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Professional Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/30 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {crawlStep === 'selecting' ? 'Select URLs to Capture' : 
                 crawlStep === 'discovering' ? 'Discovering URLs...' : 
                 'Add Screenshot'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
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
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl p-2 transition-all duration-200"
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
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    Select All ({discoveredUrls.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={deselectAllUrls}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    Deselect All
                  </Button>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedUrls.length} of {discoveredUrls.length} selected
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200/40 dark:border-slate-700/40 rounded-xl p-4 bg-slate-50/20 dark:bg-slate-900/10">
                {discoveredUrls.map((url, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                      selectedUrls.includes(url)
                        ? "border-slate-500 bg-slate-100 dark:bg-slate-700/20"
                        : "border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                    onClick={() => toggleUrlSelection(url)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUrls.includes(url)}
                      onChange={() => toggleUrlSelection(url)}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
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
                  className="text-slate-600 border-slate-300 hover:bg-slate-50 font-medium"
                >
                  Back to Settings
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedUrls.length === 0 || isLoading || localLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {(isLoading || localLoading) ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
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
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 block flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={cn(
                      "pl-10 px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-500/70 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md",
                      errors.url && "border-red-500 focus:ring-red-500/50 focus:border-red-500"
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

              {/* Professional Mode Selection */}
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 block">
                  Capture Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: 'normal' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md group",
                      formData.mode === 'normal'
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600 bg-white/50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Camera className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        formData.mode === 'normal' ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                      )} />
                      <span className={cn(
                        "font-semibold transition-colors duration-200",
                        formData.mode === 'normal' ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                      )}>
                        Single Page
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Capture a screenshot of one specific page
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: 'crawl' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md group",
                      formData.mode === 'crawl'
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600 bg-white/50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Search className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        formData.mode === 'crawl' ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                      )} />
                      <span className={cn(
                        "font-semibold transition-colors duration-200",
                        formData.mode === 'crawl' ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                      )}>
                        Crawl Site
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Discover and capture multiple pages from a website
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: 'frame' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md group",
                      formData.mode === 'frame'
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600 bg-white/50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        formData.mode === 'frame' ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                      )} />
                      <span className={cn(
                        "font-semibold transition-colors duration-200",
                        formData.mode === 'frame' ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                      )}>
                        Time Frames
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
/* ... */
                      Capture screenshots at specific time intervals
                    </p>
                  </button>
                </div>
              </div>

              {/* Professional Frame Options */}
              {formData.mode === 'frame' && (
                <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-200/40 dark:border-blue-700/40">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Time Frame Settings
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                        Time Frames (seconds)
                      </label>
                      
                      {/* Professional Preset Options */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Quick Presets:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Quick (0, 2, 5)', values: [0, 2, 5] },
                            { label: 'Standard (0, 3, 6, 10)', values: [0, 3, 6, 10] },
                            { label: 'Extended (0, 5, 10, 15, 20)', values: [0, 5, 10, 15, 20] },
                            { label: 'Animation (0, 1, 2, 3, 4, 5)', values: [0, 1, 2, 3, 4, 5] }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  frameOptions: {
                                    ...prev.frameOptions!,
                                    timeFrames: preset.values
                                  }
                                }))
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 font-medium"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Input */}
                      <Input
                        placeholder="Enter custom times: 0, 2, 5, 10"
                        value={formData.frameOptions?.timeFrames.join(', ') || ''}
                        onChange={(e) => {
                          // Better comma handling - allow spaces and handle various separators
                          const input = e.target.value
                          const frames = input
                            .split(/[,\s]+/) // Split by comma or whitespace
                            .map(f => f.trim())
                            .filter(f => f !== '')
                            .map(f => parseInt(f))
                            .filter(f => !isNaN(f) && f >= 0 && f <= 300) // Validate range
                            .sort((a, b) => a - b) // Sort ascending
                          
                          setFormData(prev => ({
                            ...prev,
                            frameOptions: {
                              ...prev.frameOptions!,
                              timeFrames: frames
                            }
                          }))
                        }}
                        onKeyDown={(e) => {
                          // Allow comma input easily
                          if (e.key === 'Enter') {
                            e.preventDefault()
                          }
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                      />
                      
                      {/* Current Selection Display */}
                      {formData.frameOptions?.timeFrames && formData.frameOptions.timeFrames.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Selected frames:</p>
                          <div className="flex flex-wrap gap-1">
                            {formData.frameOptions.timeFrames.map((time, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium"
                              >
                                {time}s
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFrames = formData.frameOptions!.timeFrames.filter((_, i) => i !== index)
                                    setFormData(prev => ({
                                      ...prev,
                                      frameOptions: {
                                        ...prev.frameOptions!,
                                        timeFrames: newFrames
                                      }
                                    }))
                                  }}
                                  className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                            Total: {formData.frameOptions.timeFrames.length} frames
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        💡 Tip: Use spaces or commas to separate times. Max 300 seconds per frame.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoScroll"
                        checked={formData.frameOptions?.autoScroll.enabled || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          frameOptions: {
                            ...prev.frameOptions!,
                            autoScroll: {
                              ...prev.frameOptions!.autoScroll,
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="autoScroll" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        Enable auto-scroll capture after frames
                      </label>
                    </div>
                    
                    {formData.frameOptions?.autoScroll.enabled && (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div>
                          <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                            Scroll Selector
                          </label>
                          <Input
                            placeholder="#viewport, .content, window"
                            value={formData.frameOptions?.autoScroll.selector || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              frameOptions: {
                                ...prev.frameOptions!,
                                autoScroll: {
                                  ...prev.frameOptions!.autoScroll,
                                  selector: e.target.value
                                }
                              }
                            }))}
                            className="px-3 py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                            Step Size (px)
                          </label>
                          <Input
                            type="number"
                            min="100"
                            max="2000"
                            value={formData.frameOptions?.autoScroll.stepSize || 500}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              frameOptions: {
                                ...prev.frameOptions!,
                                autoScroll: {
                                  ...prev.frameOptions!.autoScroll,
                                  stepSize: parseInt(e.target.value) || 500
                                }
                              }
                            }))}
                            className="px-3 py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Professional Basic Options */}
              <div className="bg-slate-50/30 dark:bg-slate-900/10 rounded-xl p-5 border border-slate-200/40 dark:border-slate-700/40">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Screenshot Settings
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1 font-medium">
                      <ArrowDown className="h-3 w-3" />
                      Width (px)
                    </label>
                    <Input
                      type="number"
                      min="320"
                      max="3840"
                      value={formData.options.width}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, width: parseInt(e.target.value) || 1920 }
                      }))}
                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1 font-medium">
                      <ArrowDown className="h-3 w-3 rotate-90" />
                      Height (px)
                    </label>
                    <Input
                      type="number"
                      min="240"
                      max="2160"
                      value={formData.options.height}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, height: parseInt(e.target.value) || 1080 }
                      }))}
                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1 font-medium">
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
                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
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
                    className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="fullPage" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    Capture full page (scroll to bottom)
                  </label>
                </div>
                
                {/* Unsticky Elements Option - only show when fullPage is enabled */}
                {formData.options.fullPage && (
                  <div className="flex items-center space-x-3 ml-6">
                    <input
                      type="checkbox"
                      id="unsticky"
                      checked={formData.options.unsticky ?? true}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, unsticky: e.target.checked }
                      }))}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="unsticky" className="text-sm text-slate-600 dark:text-slate-400">
                      Make sticky elements static (recommended for clean screenshots)
                    </label>
                  </div>
                )}
              </div>

              {/* Authentication Options */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAuthOptions(!showAuthOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Authentication Options
                  {showAuthOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showAuthOptions && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    {/* HTTP Basic Authentication */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">HTTP Basic Authentication</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Username</label>
                          <Input
                            type="text"
                            placeholder="Username"
                            value={formData.basicAuth?.username || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              basicAuth: {
                                username: e.target.value,
                                password: prev.basicAuth?.password || ''
                              }
                            }))}
                            className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Password</label>
                          <div className="relative">
                            <Input
                              type={showPasswordAuth ? "text" : "password"}
                              placeholder="Password"
                              value={formData.basicAuth?.password || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                basicAuth: {
                                  username: prev.basicAuth?.username || '',
                                  password: e.target.value
                                }
                              }))}
                              className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordAuth(!showPasswordAuth)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswordAuth ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custom Cookies */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Cookie className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Cookies (JSON)</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paste cookies as JSON array from Chrome extension or browser DevTools. 
                          <br />Example: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">[{'{"name":"session","value":"abc123","domain":".example.com"}'}]</code>
                        </p>
                        
                        <textarea
                          placeholder='[{"name":"session_token","value":"abc123","domain":".example.com","path":"/","secure":true,"httpOnly":true}]'
                          value={formData.customCookies ? JSON.stringify(formData.customCookies, null, 2) : ''}
                          onChange={(e) => {
                            try {
                              if (!e.target.value.trim()) {
                                setFormData(prev => ({ ...prev, customCookies: undefined }))
                                return
                              }
                              const cookies = JSON.parse(e.target.value)
                              if (Array.isArray(cookies)) {
                                setFormData(prev => ({ ...prev, customCookies: e.target.value }))
                              }
                            } catch (error) {
                              // Invalid JSON, don't update state
                              console.warn('Invalid cookie JSON:', error)
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono"
                          rows={4}
                        />
                        
                        {/* Cookie count indicator */}
                        {formData.customCookies && formData.customCookies.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                            <Cookie className="h-3 w-3" />
                            <span>{formData.customCookies.length} cookie(s) loaded</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, customCookies: undefined }))}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Advanced Options
                  {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showAdvancedOptions && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    {/* Device Scale Factor */}
                    <div>
                      <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium">
                        Device Scale Factor (Resolution)
                      </label>
                      <select
                        value={formData.options.deviceScaleFactor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, deviceScaleFactor: parseFloat(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      >
                        <option value={1}>1x (Standard)</option>
                        <option value={2}>2x (High DPI)</option>
                        <option value={3}>3x (Ultra High DPI)</option>
                      </select>
                    </div>

                    {/* Cookie Prevention */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="cookiePrevention"
                        checked={formData.options.cookiePrevention}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, cookiePrevention: e.target.checked }
                        }))}
                        className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="cookiePrevention" className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        Block cookie banners and tracking scripts
                      </label>
                    </div>

                    {/* Custom CSS */}
                    <div>
                      <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        Custom CSS
                      </label>
                      <textarea
                        placeholder="/* Custom CSS to inject into the page */"
                        value={formData.options.customCSS}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, customCSS: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
                        rows={3}
                      />
                    </div>

                    {/* Custom JavaScript */}
                    <div>
                      <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 block font-medium flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        Custom JavaScript
                      </label>
                      <textarea
                        placeholder="// Custom JavaScript to execute on the page"
                        value={formData.options.customJS}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, customJS: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
                        rows={3}
                      />
                    </div>
                    
                    {/* CSS/JS Injection Timing Options */}
                    {(formData.options.customCSS || formData.options.customJS) && (
                      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Injection Timing</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="injectBeforeNavigation"
                            checked={formData.options.injectBeforeNavigation ?? false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              options: { ...prev.options, injectBeforeNavigation: e.target.checked }
                            }))}
                            className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                          />
                          <label htmlFor="injectBeforeNavigation" className="text-sm text-slate-600 dark:text-slate-400">
                            Inject CSS/JS before navigation (default: after navigation)
                          </label>
                        </div>
                        
                        {/* JS Viewport Timing Option - only show when JS is provided and inject before navigation is enabled */}
                        {formData.options.customJS && formData.options.injectBeforeNavigation && (
                          <div className="flex items-center space-x-3 ml-6">
                            <input
                              type="checkbox"
                              id="injectBeforeViewport"
                              checked={formData.options.injectBeforeViewport ?? false}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                options: { ...prev.options, injectBeforeViewport: e.target.checked }
                              }))}
                              className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="injectBeforeViewport" className="text-sm text-slate-500 dark:text-slate-500">
                              Inject JS before viewport is set (default: after viewport)
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trigger Selectors - Only for individual screenshots */}
              {formData.mode === 'normal' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowTriggerOptions(!showTriggerOptions)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <MousePointer className="h-4 w-4" />
                    Interactive Triggers
                    {showTriggerOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showTriggerOptions && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Add CSS selectors to click before capturing screenshots. The system will capture a screenshot after each interaction.
                      </p>
                      
                      <div className="space-y-3">
                        {(formData.triggerSelectors || []).map((trigger, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                CSS Selector
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., .button, #menu-toggle"
                                value={trigger.selector}
                                onChange={(e) => {
                                  const newTriggers = [...(formData.triggerSelectors || [])]
                                  newTriggers[index] = { ...trigger, selector: e.target.value }
                                  setFormData(prev => ({ ...prev, triggerSelectors: newTriggers }))
                                }}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Delay (ms)
                              </label>
                              <input
                                type="number"
                                placeholder="1000"
                                value={trigger.delay}
                                onChange={(e) => {
                                  const newTriggers = [...(formData.triggerSelectors || [])]
                                  newTriggers[index] = { ...trigger, delay: parseInt(e.target.value) || 0 }
                                  setFormData(prev => ({ ...prev, triggerSelectors: newTriggers }))
                                }}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Wait After (ms)
                              </label>
                              <input
                                type="number"
                                placeholder="2000"
                                value={trigger.waitAfter}
                                onChange={(e) => {
                                  const newTriggers = [...(formData.triggerSelectors || [])]
                                  newTriggers[index] = { ...trigger, waitAfter: parseInt(e.target.value) || 0 }
                                  setFormData(prev => ({ ...prev, triggerSelectors: newTriggers }))
                                }}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                placeholder="Optional"
                                value={trigger.description || ''}
                                onChange={(e) => {
                                  const newTriggers = [...(formData.triggerSelectors || [])]
                                  newTriggers[index] = { ...trigger, description: e.target.value }
                                  setFormData(prev => ({ ...prev, triggerSelectors: newTriggers }))
                                }}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="col-span-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const newTriggers = (formData.triggerSelectors || []).filter((_, i) => i !== index)
                                  setFormData(prev => ({ ...prev, triggerSelectors: newTriggers }))
                                }}
                                className="w-full p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newTrigger = { selector: '', delay: 1000, waitAfter: 2000, description: '' }
                            setFormData(prev => ({ 
                              ...prev, 
                              triggerSelectors: [...(prev.triggerSelectors || []), newTrigger] 
                            }))
                          }}
                          className="w-full py-2 px-3 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Trigger Selector
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Automation Section */}
              {formData.mode === 'normal' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowFormAutomation(!showFormAutomation)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Form Automation
                    {showFormAutomation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showFormAutomation && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Automate multi-step form filling with validation and screenshots at each stage.
                      </p>

                  {(formData.formSteps || []).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Form Steps ({(formData.formSteps || []).length})
                      </div>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {(formData.formSteps || []).map((step, stepIndex) => (
                          <div key={stepIndex} className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  Step {stepIndex + 1}: {step.stepName || 'Unnamed Step'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSteps = (formData.formSteps || []).filter((_, i) => i !== stepIndex)
                                  setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                }}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {/* Step Name */}
                            <div className="mb-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Step Name
                              </label>
                              <Input
                                type="text"
                                value={step.stepName}
                                onChange={(e) => {
                                  const newSteps = [...(formData.formSteps || [])]
                                  newSteps[stepIndex] = { ...newSteps[stepIndex], stepName: e.target.value }
                                  setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                }}
                                className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                placeholder="e.g., Fill Login Form"
                              />
                            </div>

                            {/* Step Timeout */}
                            <div className="mb-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Step Timeout (ms)
                              </label>
                              <Input
                                type="number"
                                value={step.stepTimeout}
                                onChange={(e) => {
                                  const newSteps = [...(formData.formSteps || [])]
                                  newSteps[stepIndex] = { ...newSteps[stepIndex], stepTimeout: parseInt(e.target.value) || 5000 }
                                  setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                }}
                                className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                placeholder="5000"
                              />
                            </div>

                            {/* Screenshot Options */}
                            <div className="mb-2">
                              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                                Screenshot Options
                              </label>
                              <div className="flex flex-wrap gap-3">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={step.takeScreenshotAfterFill}
                                    onChange={(e) => {
                                      const newSteps = [...(formData.formSteps || [])]
                                      newSteps[stepIndex] = { ...newSteps[stepIndex], takeScreenshotAfterFill: e.target.checked }
                                      setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                    }}
                                    className="mr-1 h-3 w-3"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-300">After Fill</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={step.takeScreenshotAfterSubmit}
                                    onChange={(e) => {
                                      const newSteps = [...(formData.formSteps || [])]
                                      newSteps[stepIndex] = { ...newSteps[stepIndex], takeScreenshotAfterSubmit: e.target.checked }
                                      setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                    }}
                                    className="mr-1 h-3 w-3"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-300">After Submit</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={step.takeScreenshotAfterValidation}
                                    onChange={(e) => {
                                      const newSteps = [...(formData.formSteps || [])]
                                      newSteps[stepIndex] = { ...newSteps[stepIndex], takeScreenshotAfterValidation: e.target.checked }
                                      setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                    }}
                                    className="mr-1 h-3 w-3"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-300">After Validation</span>
                                </label>
                              </div>
                            </div>

                            {/* Form Inputs */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                  Form Inputs ({(step.formInputs || []).length})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSteps = [...(formData.formSteps || [])]
                                    const newInput = { selector: '', value: '', inputType: 'text' as const, description: '' }
                                    newSteps[stepIndex] = { 
                                      ...newSteps[stepIndex], 
                                      formInputs: [...(newSteps[stepIndex].formInputs || []), newInput] 
                                    }
                                    setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                  }}
                                  className="text-xs px-1 py-0.5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                  <Plus className="h-3 w-3 inline mr-1" />Add
                                </button>
                              </div>
                              
                              {(step.formInputs || []).map((input, inputIndex) => (
                                <div key={inputIndex} className="p-2 border border-slate-200 dark:border-slate-600 rounded mb-1 bg-white dark:bg-slate-700">
                                  <div className="grid grid-cols-2 gap-1 mb-1">
                                      <Input
                                        type="text"
                                        value={input.selector}
                                        onChange={(e) => {
                                          const newSteps = [...(formData.formSteps || [])]
                                          const newInputs = [...newSteps[stepIndex].formInputs]
                                          newInputs[inputIndex] = { ...newInputs[inputIndex], selector: e.target.value }
                                          newSteps[stepIndex] = { ...newSteps[stepIndex], formInputs: newInputs }
                                          setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                        }}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                        placeholder="#email, .username, [name='email']"
                                      />
                                    <Input
                                      type="text"
                                      value={input.value}
                                      onChange={(e) => {
                                        const newSteps = [...(formData.formSteps || [])]
                                        const newInputs = [...newSteps[stepIndex].formInputs]
                                        newInputs[inputIndex] = { ...newInputs[inputIndex], value: e.target.value }
                                        newSteps[stepIndex] = { ...newSteps[stepIndex], formInputs: newInputs }
                                        setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                      }}
                                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                      placeholder="Value"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <select
                                      value={input.inputType}
                                      onChange={(e) => {
                                        const newSteps = [...(formData.formSteps || [])]
                                        const newInputs = [...(newSteps[stepIndex].formInputs || [])]
                                        newInputs[inputIndex] = { ...newInputs[inputIndex], inputType: e.target.value as any }
                                        newSteps[stepIndex] = { ...newSteps[stepIndex], formInputs: newInputs }
                                        setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                      }}
                                      className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                    >
                                      <option value="text">Text</option>
                                      <option value="select">Select</option>
                                      <option value="checkbox">Checkbox</option>
                                      <option value="radio">Radio</option>
                                      <option value="textarea">Textarea</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSteps = [...(formData.formSteps || [])]
                                        const newInputs = (newSteps[stepIndex].formInputs || []).filter((_, i) => i !== inputIndex)
                                        newSteps[stepIndex] = { ...newSteps[stepIndex], formInputs: newInputs }
                                        setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                      }}
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Submit Trigger */}
                            <div className="mb-2">
                              <label className="flex items-center mb-1">
                                <input
                                  type="checkbox"
                                  checked={!!step.submitTrigger}
                                  onChange={(e) => {
                                    const newSteps = [...(formData.formSteps || [])]
                                    if (e.target.checked) {
                                      newSteps[stepIndex] = { 
                                        ...newSteps[stepIndex], 
                                        submitTrigger: { selector: '', waitAfter: 2000, description: '' }
                                      }
                                    } else {
                                      const { submitTrigger, ...rest } = newSteps[stepIndex]
                                      newSteps[stepIndex] = rest
                                    }
                                    setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                  }}
                                  className="mr-1 h-3 w-3"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Submit Trigger</span>
                              </label>
                              
                              {step.submitTrigger && (
                                <div className="p-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700">
                                  <div className="grid grid-cols-2 gap-1">
                                    <Input
                                      type="text"
                                      value={step.submitTrigger.selector}
                                      onChange={(e) => {
                                        const newSteps = [...(formData.formSteps || [])]
                                        newSteps[stepIndex] = { 
                                          ...newSteps[stepIndex], 
                                          submitTrigger: { ...newSteps[stepIndex].submitTrigger!, selector: e.target.value }
                                        }
                                        setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                      }}
                                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                      placeholder="Submit Button Selector"
                                    />
                                    <Input
                                      type="number"
                                      value={step.submitTrigger.waitAfter}
                                      onChange={(e) => {
                                        const newSteps = [...(formData.formSteps || [])]
                                        newSteps[stepIndex] = { 
                                          ...newSteps[stepIndex], 
                                          submitTrigger: { ...newSteps[stepIndex].submitTrigger!, waitAfter: parseInt(e.target.value) || 2000 }
                                        }
                                        setFormData(prev => ({ ...prev, formSteps: newSteps }))
                                      }}
                                      className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                                      placeholder="Wait After (ms)"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newStep = {
                            stepName: '',
                            formInputs: [],
                            stepTimeout: 5000,
                            takeScreenshotAfterFill: true,
                            takeScreenshotAfterSubmit: true,
                            takeScreenshotAfterValidation: false
                          }
                          setFormData(prev => ({ 
                            ...prev, 
                            formSteps: [...(prev.formSteps || []), newStep] 
                          }))
                        }}
                        className="w-full py-1 px-2 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Form Step
                      </button>
                    </div>
                  )}

                  {(formData.formSteps || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                      <div className="text-slate-500 dark:text-slate-400 mb-3">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No form steps configured</p>
                        <p className="text-xs">Add form steps to automate multi-step form filling</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newStep = {
                            stepName: 'Step 1',
                            formInputs: [],
                            stepTimeout: 5000,
                            takeScreenshotAfterFill: true,
                            takeScreenshotAfterSubmit: true,
                            takeScreenshotAfterValidation: false
                          }
                          setFormData(prev => ({ 
                            ...prev, 
                            formSteps: [newStep] 
                          }))
                        }}
                        className="py-1 px-3 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Plus className="h-3 w-3" />
                        Add First Form Step
                      </button>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || localLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isLoading || localLoading) ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      {localLoading ? 'Discovering URLs...' : 
                       formData.mode === 'crawl' ? 'Crawling...' : 
                       formData.mode === 'frame' ? 'Capturing Frames...' : 'Capturing...'}
                    </>
                  ) : (
                    <>
                      {formData.mode === 'crawl' ? (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Start Crawl
                        </>
                      ) : formData.mode === 'frame' ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Capture Frames
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
                  className="px-6 py-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all duration-200 font-medium"
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

import { useState } from 'react'
import { X, FileText, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Collection {
  id: string
  name: string
  screenshots?: any[]
}

interface Project {
  id: string
  name: string
}

interface PDFConfigModalProps {
  isOpen: boolean
  onClose: () => void
  collection?: Collection | null
  project?: Project | null
  type: 'collection' | 'project'
  onGenerate: (config: PDFConfig, type: 'collection' | 'project', id?: string) => Promise<void>
}

interface PDFConfig {
  layout: 'portrait' | 'landscape'
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal'
  imagesPerPage: number
  imageSize: 'small' | 'medium' | 'large' | 'full'
  includeMetadata: boolean
  includeUrls: boolean
  includeDates: boolean
  title: string
  margin: number
}

export function PDFConfigModal({ 
  isOpen, 
  onClose, 
  collection, 
  project, 
  type,
  onGenerate
}: PDFConfigModalProps) {
  const [config, setConfig] = useState<PDFConfig>({
    layout: 'portrait',
    pageSize: 'A4',
    imagesPerPage: 2,
    imageSize: 'medium',
    includeMetadata: true,
    includeUrls: true,
    includeDates: true,
    title: type === 'collection' ? (collection?.name || 'Collection') : (project?.name || 'Project'),
    margin: 20
  })
  const [generating, setGenerating] = useState(false)

  const handleConfigChange = (key: keyof PDFConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const getMaxImagesPerPage = () => {
    const { layout, pageSize, imageSize } = config
    
    if (imageSize === 'full') return 1
    
    const baseMax = layout === 'portrait' ? 
      (pageSize === 'A3' ? 6 : 4) : 
      (pageSize === 'A3' ? 8 : 6)
    
    if (imageSize === 'large') return Math.max(1, Math.floor(baseMax / 2))
    if (imageSize === 'small') return baseMax * 2
    
    return baseMax // medium
  }

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true)
      const id = type === 'collection' ? collection?.id : project?.id
      await onGenerate(config, type, id)
      onClose()
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) return null

  const maxImagesPerPage = getMaxImagesPerPage()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-200/30 dark:border-orange-700/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200/30 dark:border-orange-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                Generate PDF
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Configure PDF export settings
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              PDF Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-orange-200/50 dark:border-orange-700/50 rounded-lg text-orange-900 dark:text-orange-100 placeholder-orange-500/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter PDF title"
            />
          </div>

          {/* Layout & Page Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                Layout
              </label>
              <select
                value={config.layout}
                onChange={(e) => handleConfigChange('layout', e.target.value)}
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-orange-200/50 dark:border-orange-700/50 rounded-lg text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                Page Size
              </label>
              <select
                value={config.pageSize}
                onChange={(e) => handleConfigChange('pageSize', e.target.value)}
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-orange-200/50 dark:border-orange-700/50 rounded-lg text-orange-900 dark:text-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>

          {/* Images Per Page */}
          <div>
            <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              Images Per Page: {config.imagesPerPage}
            </label>
            <input
              type="range"
              min="1"
              max={maxImagesPerPage}
              value={config.imagesPerPage}
              onChange={(e) => handleConfigChange('imagesPerPage', parseInt(e.target.value))}
              className="w-full h-2 bg-orange-200/50 dark:bg-orange-700/50 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
              <span>1</span>
              <span>{maxImagesPerPage}</span>
            </div>
          </div>

          {/* Image Size */}
          <div>
            <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              Image Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['small', 'medium', 'large', 'full'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleConfigChange('imageSize', size)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    config.imageSize === size
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                      : 'bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200/50 dark:hover:bg-orange-800/30'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              Margin: {config.margin}mm
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={config.margin}
              onChange={(e) => handleConfigChange('margin', parseInt(e.target.value))}
              className="w-full h-2 bg-orange-200/50 dark:bg-orange-700/50 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
              <span>10mm</span>
              <span>50mm</span>
            </div>
          </div>

          {/* Metadata Options */}
          <div>
            <label className="block text-sm font-medium text-orange-800 dark:text-orange-200 mb-3">
              Include Metadata
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeMetadata}
                  onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-white/50 dark:bg-gray-800/50 border-orange-200/50 dark:border-orange-700/50 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-orange-800 dark:text-orange-200">Include basic metadata</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeUrls}
                  onChange={(e) => handleConfigChange('includeUrls', e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-white/50 dark:bg-gray-800/50 border-orange-200/50 dark:border-orange-700/50 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-orange-800 dark:text-orange-200">Include URLs</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeDates}
                  onChange={(e) => handleConfigChange('includeDates', e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-white/50 dark:bg-gray-800/50 border-orange-200/50 dark:border-orange-700/50 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-orange-800 dark:text-orange-200">Include capture dates</span>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-orange-50/50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200/30 dark:border-orange-700/30">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Preview</span>
            </div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 space-y-1">
              <p>Layout: {config.layout} {config.pageSize}</p>
              <p>Images: {config.imagesPerPage} per page, {config.imageSize} size</p>
              <p>Margin: {config.margin}mm</p>
              {type === 'collection' && collection?.screenshots && (
                <p>Total pages: ~{Math.ceil(collection.screenshots.length / config.imagesPerPage)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-orange-200/30 dark:border-orange-700/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { 
  Save,
  Settings,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Config {
  id: string
  key: string
  value: number | string | boolean
  description?: string
  updatedAt: string
}

// Default config values for initialization
const defaultConfigs = {
  free_tier_screenshots_per_month: 100,
  max_crawl_depth: 5,
  max_crawl_pages: 50,
  screenshot_timeout_seconds: 30,
  max_concurrent_jobs: 10,
  cleanup_old_screenshots_days: 90,
  rate_limit_requests_per_minute: 60,
  max_file_size_mb: 10
}

export default function ConfigsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [configs, setConfigs] = useState<Record<string, number>>(defaultConfigs)
  const [originalConfigs, setOriginalConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    } else if (user.role !== 'super_admin') {
      router.push('/dashboard')
      toast.error('Access denied. Admin privileges required.')
    } else {
      loadConfigs()
    }
  }, [token, user, router])

  const loadConfigs = async () => {
    try {
      setInitialLoading(true)
      const response = await apiClient.getConfigs()
      const configsData = response.configs
      setOriginalConfigs(configsData)
      
      // Convert to key-value pairs for easy manipulation
      const configMap: Record<string, number> = { ...defaultConfigs }
      configsData.forEach((config: Config) => {
        if (typeof config.value === 'number') {
          configMap[config.key] = config.value
        }
      })
      setConfigs(configMap)
    } catch (error) {
      console.error('Failed to load configs:', error)
      toast.error('Failed to load configuration')
    } finally {
      setInitialLoading(false)
    }
  }

  if (!token || !user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 dark:text-orange-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (initialLoading) {
    return (
      <DashboardLayout title="System Configuration" subtitle="Manage system-wide settings and limits">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600 dark:text-orange-400">Loading configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleConfigChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0
    setConfigs((prev: Record<string, number>) => ({ ...prev, [key]: numValue }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Update each changed config
      const promises = Object.entries(configs).map(async ([key, value]) => {
        const originalConfig = originalConfigs.find(c => c.key === key)
        if (originalConfig && originalConfig.value !== value) {
          await apiClient.updateConfig(originalConfig.id, value)
        }
      })
      
      await Promise.all(promises)
      await loadConfigs() // Reload to get updated data
      toast.success('Configuration saved successfully!')
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setConfigs(defaultConfigs)
    setHasChanges(false)
    toast.success('Configuration reset to defaults')
  }

  const configSections = [
    {
      title: 'User Limits',
      description: 'Configure user tier limits and restrictions',
      configs: [
        {
          key: 'free_tier_screenshots_per_month',
          label: 'Free Tier Screenshots per Month',
          description: 'Maximum number of screenshots free tier users can capture per month',
          value: configs.free_tier_screenshots_per_month
        }
      ]
    },
    {
      title: 'Crawling Settings',
      description: 'Configure web crawling behavior and limits',
      configs: [
        {
          key: 'max_crawl_depth',
          label: 'Maximum Crawl Depth',
          description: 'Maximum depth for crawling websites',
          value: configs.max_crawl_depth
        },
        {
          key: 'max_crawl_pages',
          label: 'Maximum Pages per Crawl',
          description: 'Maximum number of pages to crawl in a single job',
          value: configs.max_crawl_pages
        }
      ]
    },
    {
      title: 'Performance Settings',
      description: 'Configure system performance and resource limits',
      configs: [
        {
          key: 'screenshot_timeout_seconds',
          label: 'Screenshot Timeout (seconds)',
          description: 'Maximum time to wait for a screenshot to complete',
          value: configs.screenshot_timeout_seconds
        },
        {
          key: 'max_concurrent_jobs',
          label: 'Maximum Concurrent Jobs',
          description: 'Maximum number of screenshot jobs running simultaneously',
          value: configs.max_concurrent_jobs
        },
        {
          key: 'rate_limit_requests_per_minute',
          label: 'Rate Limit (requests/minute)',
          description: 'Maximum API requests per minute per user',
          value: configs.rate_limit_requests_per_minute
        }
      ]
    },
    {
      title: 'Storage Settings',
      description: 'Configure file storage and cleanup policies',
      configs: [
        {
          key: 'cleanup_old_screenshots_days',
          label: 'Cleanup Old Screenshots (days)',
          description: 'Delete screenshots older than this many days',
          value: configs.cleanup_old_screenshots_days
        },
        {
          key: 'max_file_size_mb',
          label: 'Maximum File Size (MB)',
          description: 'Maximum size for uploaded or generated files',
          value: configs.max_file_size_mb
        }
      ]
    }
  ]

  return (
    <DashboardLayout title="System Configuration" subtitle="Manage system-wide settings and limits">
      {/* Header Actions */}
      <div className="flex justify-end gap-4 mb-8">
        <Button 
          variant="outline"
          onClick={handleReset}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-8">
        {configSections.map((section) => (
          <GlassCard key={section.title}>
            <GlassCardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <GlassCardTitle>{section.title}</GlassCardTitle>
                  <GlassCardDescription>{section.description}</GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              {section.configs.map((config) => (
                <div key={config.key} className="space-y-2">
                  <Label htmlFor={config.key} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.label}
                  </Label>
                  <Input
                    id={config.key}
                    type="number"
                    value={config.value}
                    onChange={(e) => handleConfigChange(config.key, e.target.value)}
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {/* Save Reminder */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <GlassCard className="border-orange-500 bg-orange-50/50 dark:bg-orange-900/20">
            <GlassCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  You have unsaved changes
                </span>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Save Now
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  )
}

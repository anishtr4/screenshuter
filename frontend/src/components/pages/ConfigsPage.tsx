import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { apiClient } from '@/lib/api'
import { 
  Save, 
  RotateCcw,
  Globe,
  Shield,
  Clock,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'

interface ConfigSection {
  id: string
  title: string
  description: string
  icon: any
  settings: ConfigSetting[]
}

interface ConfigSetting {
  key: string
  configId?: string
  label: string
  value: string | number | boolean
  type: 'text' | 'number' | 'boolean' | 'select'
  options?: { label: string; value: string | number }[]
  description?: string
}

export function ConfigsPage() {
  const [configs, setConfigs] = useState<ConfigSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Configs - Screenshot SaaS'
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSettings()
      
      // Convert backend configs array to maps for easy lookup
      const configMap: Record<string, any> = {}
      const configIdMap: Record<string, string> = {}
      if (response.configs && Array.isArray(response.configs)) {
        response.configs.forEach((config: any) => {
          configMap[config.key] = config.value
          configIdMap[config.key] = config.id
        })
      }
      
      // Transform API response to match our UI structure
      const transformedConfigs = [
        {
          id: 'general',
          title: 'General Settings',
          description: 'Basic application configuration',
          icon: Globe,
          settings: [
            {
              key: 'free_tier_screenshots_per_month',
              configId: configIdMap.free_tier_screenshots_per_month,
              label: 'Free Tier Screenshots/Month',
              value: configMap.free_tier_screenshots_per_month || 100000,
              type: 'number' as const,
              description: 'Maximum screenshots per month for free users'
            },
            {
              key: 'free_tier_max_projects',
              configId: configIdMap.free_tier_max_projects,
              label: 'Free Tier Max Projects',
              value: configMap.free_tier_max_projects || 10,
              type: 'number' as const,
              description: 'Maximum projects for free users'
            }
          ]
        },
        {
          id: 'crawling',
          title: 'Crawling Settings',
          description: 'Web crawling configuration',
          icon: Shield,
          settings: [
            {
              key: 'crawl_max_depth',
              configId: configIdMap.crawl_max_depth,
              label: 'Max Crawl Depth',
              value: configMap.crawl_max_depth || 2,
              type: 'number' as const,
              description: 'Maximum depth for URL crawling'
            },
            {
              key: 'crawl_max_pages',
              configId: configIdMap.crawl_max_pages,
              label: 'Max Pages to Crawl',
              value: configMap.crawl_max_pages || 50,
              type: 'number' as const,
              description: 'Maximum number of pages to crawl per session'
            }
          ]
        },
        {
          id: 'screenshots',
          title: 'Screenshot Settings',
          description: 'Screenshot capture configuration',
          icon: HardDrive,
          settings: [
            {
              key: 'screenshot_timeout',
              configId: configIdMap.screenshot_timeout,
              label: 'Screenshot Timeout (ms)',
              value: configMap.screenshot_timeout || 30000,
              type: 'number' as const,
              description: 'Timeout for screenshot capture in milliseconds'
            }
          ]
        }
      ]
      
      setConfigs(transformedConfigs)
    } catch (error) {
      console.error('Failed to load configs:', error)
      // Fallback to empty array on error
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (sectionId: string, settingKey: string, value: any) => {
    setConfigs(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting => 
            setting.key === settingKey ? { ...setting, value } : setting
          )
        }
      }
      return section
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update each config individually
      const updatePromises: Promise<any>[] = []
      configs.forEach(section => {
        section.settings.forEach(setting => {
          if (setting.configId) {
            updatePromises.push(
              apiClient.updateConfig(setting.configId, setting.value)
            )
          }
        })
      })
      
      await Promise.all(updatePromises)
      toast.success('Configuration updated successfully')
    } catch (error) {
      console.error('Failed to save configs:', error)
      toast.error('Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadConfigs()
  }

  const renderSettingInput = (section: ConfigSection, setting: ConfigSetting) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value as boolean}
              onChange={(e) => handleSettingChange(section.id, setting.key, e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {setting.value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        )
      case 'select':
        return (
          <select
            value={setting.value as string}
            onChange={(e) => handleSettingChange(section.id, setting.key, e.target.value)}
            className={commonClasses}
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'number':
        return (
          <input
            type="number"
            value={setting.value as number}
            onChange={(e) => handleSettingChange(section.id, setting.key, parseInt(e.target.value))}
            className={commonClasses}
          />
        )
      default:
        return (
          <input
            type="text"
            value={setting.value as string}
            onChange={(e) => handleSettingChange(section.id, setting.key, e.target.value)}
            className={commonClasses}
          />
        )
    }
  }

  return (
    <DashboardLayout title="Configs" subtitle="System configuration and settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              System Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage application settings and configuration
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
            >
              {saving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Config Sections */}
        {loading ? (
          <div className="grid gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {configs.map((section) => {
              const Icon = section.icon
              return (
                <GlassCard key={section.id}>
                  <GlassCardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {section.settings.map((setting) => (
                        <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {setting.label}
                            </label>
                            {setting.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            {renderSettingInput(section, setting)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

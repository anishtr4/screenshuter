import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'

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
    const commonClasses = "w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
    
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value as boolean}
              onChange={(e) => handleSettingChange(section.id, setting.key, e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 px-4 py-2 rounded-xl"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold"
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 p-6">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 w-2/3"></div>
                  <div className="space-y-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {configs.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.id} className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-2xl transition-all duration-300">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                          {section.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-6">
                      {section.settings.map((setting) => (
                        <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {setting.label}
                            </label>
                            {setting.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

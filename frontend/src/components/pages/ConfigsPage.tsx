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

        {/* Enhanced Config Sections */}
        {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="group">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-xl p-6">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                  
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-600 dark:to-indigo-700 rounded-xl animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-1/3 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                      <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50">
                        <div className="space-y-1">
                          <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
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
                <div key={section.id} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/70 via-white/60 to-slate-50/50 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-900/50 backdrop-blur-[30px] shadow-2xl border border-white/50 dark:border-slate-600/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
                  {/* Stunning Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-indigo-500/8"></div>
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-indigo-400/15 via-blue-400/10 to-transparent rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-3xl"></div>
                  </div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="p-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {section.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {section.settings.map((setting) => (
                        <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start p-4 rounded-xl bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-700/60 dark:to-slate-800/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:border-white/50 dark:hover:border-slate-500/50 transition-all duration-300 hover:shadow-lg">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              {setting.label}
                            </label>
                            {setting.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Settings, 
  User,
  Key,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Copy,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { theme, setTheme } = useTheme()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey] = useState('••••••••••••••••••••••••••••••••')
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    screenshot: true,
    project: true
  })

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    // You could add a toast notification here
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <GlassCard>
            <GlassCardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left",
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "hover:bg-white/20 dark:hover:bg-gray-700/20 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Profile Information</GlassCardTitle>
                <GlassCardDescription>
                  Update your account profile information
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Email Address
                    </label>
                    <Input
                      value={user.email}
                      disabled
                      className="backdrop-blur-xl bg-white/20 border-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Role
                    </label>
                    <Input
                      value={user.role}
                      disabled
                      className="backdrop-blur-xl bg-white/20 border-white/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Company
                  </label>
                  <Input
                    placeholder="Enter your company name"
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                  />
                </div>
                
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </GlassCardContent>
            </GlassCard>
          )}

          {activeTab === 'security' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Security Settings</GlassCardTitle>
                <GlassCardDescription>
                  Manage your password and security preferences
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="backdrop-blur-xl bg-white/20 border-white/20"
                  />
                </div>
                
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </GlassCardContent>
            </GlassCard>
          )}

          {activeTab === 'api' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>API Keys</GlassCardTitle>
                <GlassCardDescription>
                  Manage your API keys for programmatic access
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="p-4 rounded-xl backdrop-blur-xl bg-yellow-100/20 border border-yellow-200/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> API key generation is currently disabled for your account. 
                    Contact an administrator to enable this feature.
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Current API Key
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                      disabled
                      className="backdrop-blur-xl bg-white/20 border-white/20 flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyApiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button disabled>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Key
                  </Button>
                  <Button variant="outline" disabled>
                    Create New Key
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {activeTab === 'notifications' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Notification Preferences</GlassCardTitle>
                <GlassCardDescription>
                  Choose how you want to be notified
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-xl bg-white/10">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        notifications.email ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          notifications.email ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-xl bg-white/10">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Browser Notifications</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Show browser push notifications</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, browser: !prev.browser }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        notifications.browser ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          notifications.browser ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-xl bg-white/10">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Screenshot Completion</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Notify when screenshots are ready</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, screenshot: !prev.screenshot }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        notifications.screenshot ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          notifications.screenshot ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-xl bg-white/10">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Project Updates</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Notify about project changes</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, project: !prev.project }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        notifications.project ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          notifications.project ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
                
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </GlassCardContent>
            </GlassCard>
          )}

          {activeTab === 'appearance' && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Appearance Settings</GlassCardTitle>
                <GlassCardDescription>
                  Customize how the application looks
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
                    Theme
                  </label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-colors",
                        theme === 'light'
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="w-full h-20 bg-white rounded-lg border mb-2"></div>
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-colors",
                        theme === 'dark'
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="w-full h-20 bg-gray-900 rounded-lg border mb-2"></div>
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                    
                    <button
                      onClick={() => setTheme('system')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-colors",
                        theme === 'system'
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="w-full h-20 bg-gradient-to-r from-white to-gray-900 rounded-lg border mb-2"></div>
                      <p className="text-sm font-medium">System</p>
                    </button>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { apiClient } from '@/lib/api'
import { ApiKeyModal } from '../modals/ApiKeyModal'
import { toast } from 'sonner'
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Activity
} from 'lucide-react'

interface ApiKeyData {
  id: string
  name: string
  key?: string
  token?: string // Alternative field name
  lastUsed?: string
  createdAt: string
  isActive: boolean
}

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  useEffect(() => {
    document.title = 'API Keys - Screenshot SaaS'
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getTokens()
      console.log('API Keys response:', response)
      const keys = response.tokens || response.data || []
      console.log('Processed API keys:', keys)
      setApiKeys(keys)
    } catch (error) {
      console.error('Failed to load API keys:', error)
      // Fallback to empty array on error
      setApiKeys([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast.error('No API key to copy')
      return
    }
    navigator.clipboard.writeText(text)
    toast.success('API key copied to clipboard!')
  }

  const maskApiKey = (key: string) => {
    if (!key || typeof key !== 'string') {
      return '••••••••••••••••••••••••'
    }
    if (key.length < 12) {
      return '••••••••••••••••••••••••'
    }
    return key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4)
  }

  const handleCreateKey = async (name: string) => {
    try {
      const response = await apiClient.createToken(name)
      console.log('Create token response:', response)
      toast.success('API key created successfully!')
      await loadApiKeys() // Refresh the list
      
      // Handle different possible response structures
      if (response.token) {
        return {
          id: response.token.id || response.id,
          name: response.token.name || name,
          key: response.token.token || response.token.key || response.token,
          createdAt: response.token.createdAt || response.createdAt || new Date().toISOString()
        }
      } else {
        return {
          id: response.id,
          name: response.name || name,
          key: response.token || response.key || response,
          createdAt: response.createdAt || new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
      toast.error('Failed to create API key')
      throw error
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      await apiClient.deleteToken(keyId)
      toast.success('API key deleted successfully!')
      await loadApiKeys() // Refresh the list
    } catch (error) {
      console.error('Failed to delete API key:', error)
      toast.error('Failed to delete API key')
      throw error
    }
  }



  return (
    <DashboardLayout title="API Keys" subtitle="Manage your API keys and access tokens">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              API Keys
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage API keys for programmatic access
            </p>
          </div>
          <Button 
            onClick={() => setShowApiKeyModal(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* API Keys List */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <GlassCard key={apiKey.id} className="hover:shadow-lg transition-shadow">
                <GlassCardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {apiKey.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created {formatDate(apiKey.createdAt)}</span>
                            </div>
                            {apiKey.lastUsed && (
                              <div className="flex items-center space-x-1">
                                <Activity className="h-3 w-3" />
                                <span>Last used {formatDate(apiKey.lastUsed)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                          {(() => {
                            const keyValue = apiKey.key || apiKey.token || ''
                            return showKeys[apiKey.id] ? (keyValue || 'No key available') : maskApiKey(keyValue)
                          })()}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key || apiKey.token || '')}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        apiKey.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && apiKeys.length === 0 && (
          <div className="text-center py-12">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No API keys yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first API key to start using our API
            </p>
            <Button 
              onClick={() => setShowApiKeyModal(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </div>
        )}
      </div>
      
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onCreateKey={handleCreateKey}
      />
    </DashboardLayout>
  )
}

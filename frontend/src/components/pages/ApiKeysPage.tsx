import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'

import { apiClient } from '@/lib/api'
import { ApiKeyModal } from '../modals/ApiKeyModal'
import { toast } from 'sonner'
import { 
  Key, 
  Plus, 
  Trash2, 
  Calendar,
  Activity,
  Shield
} from 'lucide-react'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'

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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyData | null>(null)

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

  const confirmDelete = (apiKey: ApiKeyData) => {
    setKeyToDelete(apiKey)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (keyToDelete) {
      await handleDeleteKey(keyToDelete.id)
      setShowDeleteModal(false)
      setKeyToDelete(null)
    }
  }



  return (
    <DashboardLayout title="API Keys" subtitle="Manage your API keys for external integrations">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <Button 
            onClick={() => setShowApiKeyModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 p-6">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Key className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {apiKey.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span>Created {formatDate(apiKey.createdAt)}</span>
                            </div>
                            {apiKey.lastUsed && (
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span>Last used {formatDate(apiKey.lastUsed)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* API Key Placeholder */}
                      <div className="flex items-center space-x-3 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                        <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            API Key (Hidden for Security)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Your API key is securely stored and ready to use
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        apiKey.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(apiKey)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl p-2 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && apiKeys.length === 0 && (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-2xl mx-auto w-fit">
                <Key className="h-16 w-16 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              No API keys yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Create your first API key to start integrating with our platform and unlock powerful automation capabilities.
            </p>
            <Button 
              onClick={() => setShowApiKeyModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold text-base"
            >
              <Plus className="h-5 w-5 mr-2" />
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete API Key"
        description={`Are you sure you want to delete the API key "${keyToDelete?.name}"? This action cannot be undone and will immediately revoke access for any applications using this key.`}
        confirmText="Delete Key"
        type="danger"
        icon="key"
      />
    </DashboardLayout>
  )
}

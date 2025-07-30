'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Key,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { CreateTokenModal } from '@/components/modals/CreateTokenModal'

interface Token {
  id: string
  _id?: string
  name: string
  token: string
  lastUsed: string | null
  createdAt: string
  active: boolean
}

export default function TokensPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    } else if (!user.tokenCreationEnabled) {
      router.push('/dashboard')
      toast.error('Access denied. Token creation is not enabled for your account.')
    } else {
      loadTokens()
    }
  }, [token, user, router])

  const loadTokens = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getTokens()
      setTokens(response.tokens || [])
    } catch (error) {
      console.error('Failed to load tokens:', error)
      toast.error('Failed to load API tokens')
    } finally {
      setLoading(false)
    }
  }

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

  if (!user.tokenCreationEnabled) {
    return (
      <DashboardLayout title="API Tokens" subtitle="Manage your API access tokens">
        <GlassCard>
          <GlassCardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              API Token Creation Disabled
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your account does not have permission to create API tokens. 
              Please contact your administrator to enable this feature.
            </p>
          </GlassCardContent>
        </GlassCard>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="API Tokens" subtitle="Manage your API access tokens">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading tokens...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleTokenCreated = (newToken: Token) => {
    // Add the new token to the list
    setTokens([newToken, ...tokens])
  }

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await apiClient.deleteToken(tokenId)
      
      // Remove token from local state
      setTokens(tokens.filter(t => (t._id || t.id) !== tokenId))
      toast.success('API token revoked successfully!')
    } catch (error) {
      console.error('Failed to revoke token:', error)
      toast.error('Failed to revoke API token')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskToken = (token: string) => {
    if (!token) return 'sk-••••••••••••••••••••••••••••••••'
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`
  }

  return (
    <DashboardLayout title="API Tokens" subtitle="Manage your API access tokens">
      {/* Header Actions */}
      <div className="flex justify-end mb-8">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate New Token
        </Button>
      </div>

      {/* Tokens List */}
      <div className="space-y-4">
        {tokens.map((t) => (
          <GlassCard key={t.id}>
            <GlassCardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t.name}
                    </h3>
                    <Badge variant={t.active ? 'default' : 'secondary'}>
                      {t.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <code className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </code>
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Token hidden for security
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(t.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Last used {formatDate(t.lastUsed)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeToken(t.id)}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {tokens.length === 0 && (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API tokens yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate your first API token to start using the Screenshot API
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Your First Token
          </Button>
        </div>
      )}

      {/* Create Token Modal */}
      <CreateTokenModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTokenCreated={handleTokenCreated}
      />
    </DashboardLayout>
  )
}

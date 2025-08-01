import { useState } from 'react'
import { X, Key, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
}

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateKey: (name: string) => Promise<ApiKey>
}

export const ApiKeyModal = ({ isOpen, onClose, onCreateKey }: ApiKeyModalProps) => {
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null)

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    try {
      setCreating(true)
      const newKey = await onCreateKey(newKeyName.trim())
      setNewlyCreatedKey(newKey)
      setNewKeyName('')
      toast.success('API key created successfully!')
    } catch (error) {
      console.error('Failed to create API key:', error)
      toast.error('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('API key copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleClose = () => {
    if (!creating) {
      setNewKeyName('')
      setNewlyCreatedKey(null)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-white/10 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create API Key
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={creating}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!newlyCreatedKey ? (
              /* Create Form */
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter a name for your API key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creating}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newKeyName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? 'Creating...' : 'Create API Key'}
                  </Button>
                </div>
              </form>
            ) : (
              /* Success Display */
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      API Key Created Successfully!
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your API key "{newlyCreatedKey.name}" has been created.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start space-x-2 mb-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">
                        ⚠️ Save this API key now!
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        This is the only time you'll see the full key. Copy it and store it securely.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-3 border">
                    <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                      {newlyCreatedKey.key || (newlyCreatedKey as any).token || 'Key not available'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newlyCreatedKey.key || (newlyCreatedKey as any).token || '')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Created: {formatDate(newlyCreatedKey.createdAt)}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

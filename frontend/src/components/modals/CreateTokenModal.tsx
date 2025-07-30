'use client'

import { useState } from 'react'
import { X, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'

interface CreateTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onTokenCreated: (token: any) => void
}

export function CreateTokenModal({ isOpen, onClose, onTokenCreated }: CreateTokenModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [tokenName, setTokenName] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setStep('form')
    setTokenName('')
    setGeneratedToken('')
    setCopied(false)
    onClose()
  }

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      toast.error('Please enter a token name')
      return
    }

    try {
      setLoading(true)
      const { apiClient } = await import('@/lib/api')
      const response = await apiClient.createToken(tokenName.trim())
      
      setGeneratedToken(response.token.token)
      onTokenCreated(response.token)
      setStep('success')
      toast.success('API token created successfully!')
    } catch (error) {
      console.error('Failed to create token:', error)
      toast.error('Failed to create API token')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken)
      setCopied(true)
      toast.success('Token copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy token')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'form' && !loading) {
      handleCreateToken()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-200/30 dark:border-orange-700/30 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200/30 dark:border-orange-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                {step === 'form' ? 'Create API Token' : 'Token Created'}
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {step === 'form' ? 'Generate a new API token' : 'Save this token securely'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Token Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Production API, Development Testing"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-gray-800/50 text-orange-900 dark:text-orange-100 placeholder-orange-500/60 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateToken}
                  disabled={loading || !tokenName.trim()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Token
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="px-6 py-3 rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Important Security Notice
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This token will only be shown once. Please copy and save it securely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Display */}
              <div>
                <label className="block text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Your API Token
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={generatedToken}
                    readOnly
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 font-mono text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Token
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="px-6 py-3 rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

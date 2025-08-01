'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User, Edit, X, Shield, UserCheck } from 'lucide-react'
import { User as UserType } from '@/types'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userId: string, updates: { email?: string; role?: string; active?: boolean; tokenCreationEnabled?: boolean }) => void
  user: UserType | null
  loading?: boolean
}

export function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  loading = false
}: EditUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'super_admin'>('user')
  const [active, setActive] = useState(true)
  const [tokenCreationEnabled, setTokenCreationEnabled] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setRole(user.role)
      setActive(user.active)
      setTokenCreationEnabled(user.tokenCreationEnabled)
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = () => {
    if (email.trim()) {
      const updates: any = {}
      
      if (email !== user.email) updates.email = email.trim()
      if (role !== user.role) updates.role = role
      if (active !== user.active) updates.active = active
      if (tokenCreationEnabled !== user.tokenCreationEnabled) updates.tokenCreationEnabled = tokenCreationEnabled
      
      onSubmit(user._id || user.id, updates)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const hasChanges = email !== user.email || 
                    role !== user.role || 
                    active !== user.active || 
                    tokenCreationEnabled !== user.tokenCreationEnabled

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/20 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-orange-900/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto backdrop-blur-2xl bg-white/30 dark:bg-orange-900/40 border border-orange-200/30 dark:border-orange-700/30 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
            <Edit className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100">
              Edit User
            </h2>
            <p className="text-orange-700 dark:text-orange-300 text-sm">
              Update user information and permissions
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="hover:bg-orange-100/20 dark:hover:bg-orange-800/20 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-600 dark:placeholder-orange-400 transition-all duration-200"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
              Role
            </label>
            <div className="flex gap-2">
              <Button
                variant={role === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRole('user')}
                disabled={loading}
                className={`flex-1 ${role === 'user' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white' 
                  : 'text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 hover:bg-white/40 dark:hover:bg-orange-800/40'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                User
              </Button>
              <Button
                variant={role === 'super_admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRole('super_admin')}
                disabled={loading}
                className={`flex-1 ${role === 'super_admin' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white' 
                  : 'text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 hover:bg-white/40 dark:hover:bg-orange-800/40'
                }`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
              Status & Permissions
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl backdrop-blur-xl bg-white/20 dark:bg-orange-800/20 border border-orange-200/30 dark:border-orange-700/30">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">Account Active</span>
                </div>
                <Button
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActive(!active)}
                  disabled={loading}
                  className={active 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                    : 'text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 hover:bg-white/40 dark:hover:bg-orange-800/40'
                  }
                >
                  {active ? 'Active' : 'Inactive'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl backdrop-blur-xl bg-white/20 dark:bg-orange-800/20 border border-orange-200/30 dark:border-orange-700/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">API Token Creation</span>
                </div>
                <Button
                  variant={tokenCreationEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenCreationEnabled(!tokenCreationEnabled)}
                  disabled={loading}
                  className={tokenCreationEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                    : 'text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 hover:bg-white/40 dark:hover:bg-orange-800/40'
                  }
                >
                  {tokenCreationEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 rounded-xl hover:bg-white/40 dark:hover:bg-orange-800/40 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!email.trim() || !hasChanges || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Update User
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

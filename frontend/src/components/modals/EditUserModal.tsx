import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User, Edit, X, Shield, UserCheck, Key } from 'lucide-react'

interface UserType {
  id: string
  _id?: string
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'admin' | 'super_admin'
  createdAt: string
  lastLogin?: string
  active: boolean
  tokenCreationEnabled: boolean
  projectCount?: number
}

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
      setRole(user.role === 'admin' ? 'super_admin' : user.role as 'user' | 'super_admin')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
            <Edit className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit User
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Update user information and permissions
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
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
                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Status & Permissions
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Account Active</span>
                </div>
                <Button
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActive(!active)}
                  disabled={loading}
                  className={active 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                >
                  {active ? 'Active' : 'Inactive'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">API Token Creation</span>
                </div>
                <Button
                  variant={tokenCreationEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenCreationEnabled(!tokenCreationEnabled)}
                  disabled={loading}
                  className={tokenCreationEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
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
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!email.trim() || !hasChanges || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
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

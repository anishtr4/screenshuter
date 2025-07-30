'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { AddUserModal } from '@/components/modals/AddUserModal'
import { EditUserModal } from '@/components/modals/EditUserModal'
import { 
  Plus, 
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  KeyRound,
  Users,
  Shield,
  AlertTriangle,
  Calendar,
  Grid3X3,
  List
} from 'lucide-react'
import { User } from '@/types'

interface CreateUserForm {
  email: string
  password: string
  role: 'user' | 'super_admin'
}

export default function UsersPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/dashboard')
      toast.error('Access denied. Admin privileges required.')
    }
  }, [user, router])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
    icon?: 'delete' | 'user' | 'key' | 'shield' | 'warning'
    loading?: boolean
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [token, user, router])

  const loadUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const response = await apiClient.getUsers()
      setUsers(response.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  if (!token || !user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter((u: User) =>
    u?.email?.toLowerCase()?.includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = async (email: string, password: string, role: string) => {
    try {
      setCreating(true)
      const newUser = await apiClient.createUser(email, password, role)
      setUsers([newUser, ...users])
      setShowAddModal(false)
      toast.success('User created successfully')
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      setUpdating(true)
      const response = await apiClient.updateUser(userId, updates)
      toast.success('User updated successfully')
      
      // Update the user in the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          (u._id || u.id) === userId 
            ? { ...u, ...response.user, _id: u._id || u.id }
            : u
        )
      )
      
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('Failed to update user')
    } finally {
      setUpdating(false)
    }
  }

  const toggleUserActive = (userId: string) => {
    const targetUser = users.find((u: User) => (u._id || u.id) === userId)
    if (!targetUser) return

    setConfirmModal({
      isOpen: true,
      title: `${targetUser.active ? 'Deactivate' : 'Activate'} User`,
      description: `Are you sure you want to ${targetUser.active ? 'deactivate' : 'activate'} ${targetUser.email}? ${targetUser.active ? 'They will lose access to the system.' : 'They will regain access to the system.'}`,
      type: targetUser.active ? 'warning' : 'info',
      icon: 'user',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }))
          await apiClient.updateUser(userId, { active: !targetUser.active })
          toast.success(`User ${targetUser.active ? 'deactivated' : 'activated'} successfully`)
          loadUsers()
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }))
        } catch (error) {
          console.error('Failed to update user:', error)
          toast.error('Failed to update user status')
          setConfirmModal(prev => ({ ...prev, loading: false }))
        }
      }
    })
  }

  const toggleTokenCreation = (userId: string) => {
    const targetUser = users.find((u: User) => (u._id || u.id) === userId)
    if (!targetUser) return

    setConfirmModal({
      isOpen: true,
      title: `${targetUser.tokenCreationEnabled ? 'Disable' : 'Enable'} API Tokens`,
      description: `Are you sure you want to ${targetUser.tokenCreationEnabled ? 'disable' : 'enable'} API token creation for ${targetUser.email}? ${targetUser.tokenCreationEnabled ? 'They will not be able to create new API tokens.' : 'They will be able to create API tokens.'}`,
      type: 'info',
      icon: 'key',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }))
          await apiClient.updateUser(userId, { tokenCreationEnabled: !targetUser.tokenCreationEnabled })
          toast.success(`Token creation ${targetUser.tokenCreationEnabled ? 'disabled' : 'enabled'} for user`)
          loadUsers()
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }))
        } catch (error) {
          console.error('Failed to update user:', error)
          toast.error('Failed to update token creation setting')
          setConfirmModal(prev => ({ ...prev, loading: false }))
        }
      }
    })
  }

  const handleDeleteUser = (userId: string, userEmail: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      description: `Are you sure you want to delete user "${userEmail}"? This will permanently remove their account and all associated data. This action cannot be undone.`,
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }))
          setDeleting(userId)
          await apiClient.deleteUser(userId)
        
        // Remove the deleted user from local state instead of reloading
        setUsers(prev => prev.filter(user => (user._id || user.id) !== userId))
        
        toast.success('User deleted successfully')
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }))
        } catch (error) {
          console.error('Failed to delete user:', error)
          toast.error('Failed to delete user')
          setConfirmModal(prev => ({ ...prev, loading: false }))
        } finally {
          setDeleting(null)
        }
      }
    })
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

  if (loading) {
    return (
      <DashboardLayout title="User Management" subtitle="Manage system users and permissions">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600 dark:text-orange-400">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="User Management" subtitle="Manage system users and permissions">
      <div className="h-full flex flex-col overflow-hidden">
      {/* Enhanced Header Actions */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
          <Input
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-4 rounded-xl backdrop-blur-xl bg-white/20 dark:bg-orange-800/20 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-500 dark:placeholder-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white/20 dark:bg-orange-800/20 rounded-xl p-1 border border-orange-200/30 dark:border-orange-700/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-800/50'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-800/50'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Enhanced Users Table */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <GlassCardTitle className="text-orange-900 dark:text-orange-100">System Users</GlassCardTitle>
                <GlassCardDescription className="text-orange-600 dark:text-orange-400">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </GlassCardDescription>
              </div>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {viewMode === 'list' ? (
            /* List View */
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-600 scrollbar-track-orange-100 dark:scrollbar-track-orange-900/20">
              <table className="w-full">
                <thead className="sticky top-0 bg-gradient-to-r from-orange-100/90 to-amber-100/90 dark:from-orange-900/90 dark:to-amber-900/90 backdrop-blur-xl z-10">
                  <tr className="border-b border-orange-200 dark:border-orange-700">
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">API Tokens</th>
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">Last Login</th>
                    <th className="text-left px-4 py-3 font-semibold text-orange-800 dark:text-orange-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: User) => (
                    <tr key={u._id || u.id} className="border-b border-orange-100/20 dark:border-orange-800/20 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors duration-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white font-semibold shadow-lg">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-orange-900 dark:text-orange-100">
                              {u.email}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {formatDate(u.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={u.role === 'super_admin' ? 'destructive' : 'default'}
                          className="rounded-lg flex items-center gap-1 w-fit"
                        >
                          {u.role === 'super_admin' ? (
                            <><Shield className="h-3 w-3" /> Admin</>
                          ) : (
                            <><Users className="h-3 w-3" /> User</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={u.active ? 'default' : 'secondary'}
                          className="rounded-lg flex items-center gap-1 w-fit"
                        >
                          {u.active ? (
                            <><UserCheck className="h-3 w-3" /> Active</>
                          ) : (
                            <><UserX className="h-3 w-3" /> Inactive</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={u.tokenCreationEnabled ? 'default' : 'secondary'}
                          className="rounded-lg flex items-center gap-1 w-fit"
                        >
                          {u.tokenCreationEnabled ? (
                            <><Key className="h-3 w-3" /> Enabled</>
                          ) : (
                            <><KeyRound className="h-3 w-3" /> Disabled</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(u.lastLogin || null)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserActive(u._id || u.id)}
                            className="rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200"
                            title={u.active ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTokenCreation(u._id || u.id)}
                            className="rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200"
                            title={u.tokenCreationEnabled ? 'Disable API tokens' : 'Enable API tokens'}
                          >
                            {u.tokenCreationEnabled ? <KeyRound className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(u)}
                            className="rounded-xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(u._id || u.id, u.email)}
                            disabled={deleting === (u._id || u.id)}
                            className="rounded-xl border-red-200 dark:border-red-700 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                            title="Delete user"
                          >
                            {deleting === (u._id || u.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="flex-1 p-6 overflow-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-600 scrollbar-track-orange-100 dark:scrollbar-track-orange-900/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((u: User) => (
                  <div key={u._id || u.id} className="bg-white/20 dark:bg-orange-800/20 backdrop-blur-xl rounded-xl border border-orange-200/30 dark:border-orange-700/30 p-6 hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-all duration-200 shadow-lg hover:shadow-xl">
                    {/* User Avatar and Info */}
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 text-sm break-all leading-tight">
                        {u.email}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(u.createdAt)}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-center">
                        <Badge 
                          variant={u.role === 'super_admin' ? 'destructive' : 'default'}
                          className="rounded-lg flex items-center gap-1 text-xs"
                        >
                          {u.role === 'super_admin' ? (
                            <><Shield className="h-3 w-3" /> Admin</>
                          ) : (
                            <><Users className="h-3 w-3" /> User</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Badge 
                          variant={u.active ? 'default' : 'secondary'}
                          className="rounded-lg flex items-center gap-1 text-xs"
                        >
                          {u.active ? (
                            <><UserCheck className="h-3 w-3" /> Active</>
                          ) : (
                            <><UserX className="h-3 w-3" /> Inactive</>
                          )}
                        </Badge>
                        <Badge 
                          variant={u.tokenCreationEnabled ? 'default' : 'secondary'}
                          className="rounded-lg flex items-center gap-1 text-xs"
                        >
                          {u.tokenCreationEnabled ? (
                            <><Key className="h-3 w-3" /> API</>
                          ) : (
                            <><KeyRound className="h-3 w-3" /> No API</>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className="text-center mb-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last: {formatDate(u.lastLogin || null)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserActive(u._id || u.id)}
                        className="rounded-lg border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 p-2"
                        title={u.active ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTokenCreation(u._id || u.id)}
                        className="rounded-lg border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 p-2"
                        title={u.tokenCreationEnabled ? 'Disable API tokens' : 'Enable API tokens'}
                      >
                        {u.tokenCreationEnabled ? <KeyRound className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(u)}
                        className="rounded-lg border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 p-2"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteUser(u._id || u.id, u.email)}
                        disabled={deleting === (u._id || u.id)}
                        className="rounded-lg border-red-200 dark:border-red-700 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 p-2"
                        title="Delete user"
                      >
                        {deleting === (u._id || u.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Enhanced Empty State */}
      {filteredUsers.length === 0 && (
        <GlassCard className="mt-8">
          <GlassCardContent className="text-center py-16">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500/15 to-amber-600/15 flex items-center justify-center mb-6 shadow-lg">
                {searchTerm ? (
                  <Search className="h-10 w-10 text-orange-500" />
                ) : (
                  <Users className="h-10 w-10 text-orange-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-3">
                {searchTerm ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-orange-600 dark:text-orange-400 mb-8 max-w-md text-lg">
                {searchTerm 
                  ? `No users match "${searchTerm}". Try adjusting your search terms.`
                  : 'Get started by creating your first user account.'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First User
                </Button>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
        loading={creating}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSubmit={handleUpdateUser}
        user={editingUser}
        loading={updating}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type}
        icon={confirmModal.icon}
        loading={confirmModal.loading}
      />
      </div>
    </DashboardLayout>
  )
}

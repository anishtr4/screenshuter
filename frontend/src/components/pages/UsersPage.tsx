import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { AddUserModal } from '@/components/modals/AddUserModal'
import { EditUserModal } from '@/components/modals/EditUserModal'
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Key,
  Download,
  UserCheck,
  UserX,
  Shield,
  Crown
} from 'lucide-react'

interface User {
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

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    document.title = 'Users - Screenshot SaaS'
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUsers(1, 50) // Get more users for admin view
      const userData = response.users || response.data || []
      // Normalize user data to ensure id field exists
      const normalizedUsers = userData.map((user: any) => ({
        ...user,
        id: user.id || user._id // Ensure id field exists
      }))
      setUsers(normalizedUsers)
      setFilteredUsers(normalizedUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users. Please refresh the page.')
      // Fallback to empty array on error
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.active : !user.active
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300'
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === 'super_admin') return <Crown className="h-3 w-3" />
    if (role === 'admin') return <Shield className="h-3 w-3" />
    return null
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      default: return 'User'
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    try {
      switch (action) {
        case 'activate':
          await apiClient.bulkUpdateUsers(selectedUsers, { active: true })
          break
        case 'deactivate':
          await apiClient.bulkUpdateUsers(selectedUsers, { active: false })
          break
        case 'enableTokens':
          await apiClient.bulkUpdateUsers(selectedUsers, { tokenCreationEnabled: true })
          break
        case 'disableTokens':
          await apiClient.bulkUpdateUsers(selectedUsers, { tokenCreationEnabled: false })
          break
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
            await apiClient.bulkDeleteUsers(selectedUsers)
          } else {
            return
          }
          break
        default:
          console.log(`Unknown bulk action: ${action}`)
          return
      }
      
      // Refresh users list and clear selection
      await loadUsers()
      setSelectedUsers([])
      
      // Show success message
      toast.success(`Successfully ${action === 'activate' ? 'activated' : action === 'deactivate' ? 'deactivated' : action === 'enableTokens' ? 'enabled tokens for' : action === 'disableTokens' ? 'disabled tokens for' : 'deleted'} ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error)
      toast.error(`Failed to ${action} users. Please try again.`)
    }
  }

  const handleCreateUser = async (firstName: string, lastName: string, email: string, password: string, role: string) => {
    try {
      setCreating(true)
      await apiClient.createUser({ firstName, lastName, email, password, role })
      await loadUsers()
      setShowAddModal(false)
      toast.success('User created successfully')
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('Failed to create user. Please try again.')
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
      await apiClient.updateUser(userId, updates)
      await loadUsers()
      setShowEditModal(false)
      setEditingUser(null)
      toast.success('User updated successfully')
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('Failed to update user. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'edit':
          const userToEdit = users.find(u => u.id === userId)
          if (userToEdit) {
            handleEditUser(userToEdit)
          }
          break
        case 'activate':
          await apiClient.activateUser(userId)
          break
        case 'deactivate':
          await apiClient.deactivateUser(userId)
          break
        case 'enableTokens':
          await apiClient.enableTokenCreation(userId)
          break
        case 'disableTokens':
          await apiClient.disableTokenCreation(userId)
          break
        case 'makeAdmin':
          await apiClient.changeUserRole(userId, 'super_admin')
          break
        case 'makeUser':
          await apiClient.changeUserRole(userId, 'user')
          break
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await apiClient.deleteUser(userId)
          } else {
            return
          }
          break
        default:
          console.log(`Unknown user action: ${action}`)
          return
      }
      
      // Refresh users list
      await loadUsers()
      
      // Show success message
      const actionMessages = {
        activate: 'User activated successfully',
        deactivate: 'User deactivated successfully',
        enableTokens: 'Token creation enabled for user',
        disableTokens: 'Token creation disabled for user',
        makeAdmin: 'User promoted to admin',
        makeUser: 'User role changed to user',
        delete: 'User deleted successfully'
      }
      toast.success(actionMessages[action as keyof typeof actionMessages] || `Action ${action} completed successfully`)
    } catch (error) {
      console.error(`Failed to perform ${action} on user ${userId}:`, error)
      toast.error(`Failed to ${action} user. Please try again.`)
    }
  }

  return (
    <DashboardLayout title={`Users (${filteredUsers.length})`} subtitle="Manage user accounts and permissions">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 rounded-xl font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button 
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
                className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
                className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
              >
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('enableTokens')}
                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
              >
                <Key className="h-4 w-4 mr-1" />
                Enable Tokens
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('disableTokens')}
                className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
              >
                <Key className="h-4 w-4 mr-1" />
                Disable Tokens
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
          
          <div className="relative">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Token Access
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Projects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || 'User'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span>{getRoleLabel(user.role)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            user.active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            user.tokenCreationEnabled 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {user.tokenCreationEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {user.projectCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, user.active ? 'deactivate' : 'activate')}
                              className={user.active 
                                ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                                : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }
                              title={user.active ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, user.tokenCreationEnabled ? 'disableTokens' : 'enableTokens')}
                              className={user.tokenCreationEnabled 
                                ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20" 
                                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              }
                              title={user.tokenCreationEnabled ? 'Disable Token Creation' : 'Enable Token Creation'}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'edit')}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl border border-slate-200/40 dark:border-slate-700/40">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/50"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
            
            <div className="relative p-12">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
                  <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto w-fit">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  {users.length === 0 ? 'No users found' : 'No users match your filters'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  {users.length === 0 
                    ? 'Invite users to start collaborating on projects and manage access permissions.'
                    : 'Try adjusting your search or filter criteria to find the users you\'re looking for.'
                  }
                </p>
                {users.length === 0 && (
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold text-base"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Invite Your First User
                  </Button>
                )}
              </div>
            </div>
          </div>
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
      </div>
    </DashboardLayout>
  )
}

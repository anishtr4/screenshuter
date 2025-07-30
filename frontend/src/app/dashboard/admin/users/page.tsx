'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Users, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  Settings,
  Key,
  Ban,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data - replace with real API calls
const mockUsers = [
  {
    id: '1',
    email: 'admin@screenshot-saas.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-01-20',
    screenshotCount: 156,
    projectCount: 12,
    apiTokenEnabled: true
  },
  {
    id: '2',
    email: 'john.doe@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-19',
    screenshotCount: 45,
    projectCount: 3,
    apiTokenEnabled: false
  },
  {
    id: '3',
    email: 'jane.smith@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-16',
    screenshotCount: 12,
    projectCount: 2,
    apiTokenEnabled: true
  }
]

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [users, setUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user')

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    } else if (user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [token, user, router])

  if (!token || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = () => {
    if (newUserEmail.trim()) {
      const newUser = {
        id: Date.now().toString(),
        email: newUserEmail,
        role: newUserRole,
        status: 'active' as const,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        screenshotCount: 0,
        projectCount: 0,
        apiTokenEnabled: false
      }
      setUsers([newUser, ...users])
      setNewUserEmail('')
      setNewUserRole('user')
      setShowCreateForm(false)
    }
  }

  const toggleApiToken = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, apiTokenEnabled: !user.apiTokenEnabled }
        : user
    ))
  }

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ))
  }

  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return dateString
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DashboardLayout title="User Management" subtitle="Manage users and their permissions">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 backdrop-blur-xl bg-white/20 border-white/20"
          />
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <GlassCard className="mb-8">
          <GlassCardHeader>
            <GlassCardTitle>Create New User</GlassCardTitle>
            <GlassCardDescription>
              Add a new user to the system
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="backdrop-blur-xl bg-white/20 border-white/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Role
              </label>
              <div className="flex gap-2">
                <Button
                  variant={newUserRole === 'user' ? 'default' : 'outline'}
                  onClick={() => setNewUserRole('user')}
                  size="sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  User
                </Button>
                <Button
                  variant={newUserRole === 'admin' ? 'default' : 'outline'}
                  onClick={() => setNewUserRole('admin')}
                  size="sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Users Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Users</GlassCardTitle>
          <GlassCardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 dark:border-gray-700/20">
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Usage</th>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">API Token</th>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Last Login</th>
                  <th className="text-right p-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/10 dark:border-gray-700/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Joined {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        user.role === 'admin'
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      )}>
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        user.status === 'active'
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      )}>
                        {user.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">
                          {user.screenshotCount} screenshots
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {user.projectCount} projects
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleApiToken(user.id)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          user.apiTokenEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            user.apiTokenEnabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(user.lastLogin)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCardContent>
      </GlassCard>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No users found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first user'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First User
            </Button>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

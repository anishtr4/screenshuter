import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Camera, 
  LayoutDashboard,
  FolderOpen,
  Settings,
  Users,
  Bell,
  Menu,
  X,
  LogOut,
  Key
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    logout()
  }

  const sidebarItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, color: 'text-purple-500' },
    ...(user?.tokenCreationEnabled ? [
      { href: '/settings', label: 'API Keys', icon: Key, color: 'text-amber-500' },
    ] : []),
    ...(user?.role === 'super_admin' ? [
      { href: '/users', label: 'Users', icon: Users, color: 'text-green-500' },
      { href: '/configs', label: 'Configs', icon: Settings, color: 'text-orange-500' },
    ] : [])
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-900 relative overflow-hidden flex">
      {/* Enhanced Global Background Patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large Floating Orbs */}
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-orange-200/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-amber-200/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-300/20 to-amber-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '6s'}}></div>
        
        {/* Geometric Patterns */}
        <div className="absolute top-20 right-20 w-6 h-6 bg-orange-400/20 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-20 w-4 h-4 bg-amber-400/25 rounded-full animate-bounce" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-orange-300/20 rounded-full animate-bounce" style={{animationDelay: '7s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-amber-300/30 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Enhanced Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col backdrop-blur-2xl bg-white/10 dark:bg-orange-900/20 border-r border-orange-200/20 dark:border-orange-700/20 shadow-2xl">
          {/* Enhanced Logo Section */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-orange-200/20 dark:border-orange-700/20">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-xl shadow-xl">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-900 to-amber-800 dark:from-orange-100 dark:to-amber-200 bg-clip-text text-transparent">
                  ScreenShot
                </span>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  SaaS Platform
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-orange-100/20 dark:hover:bg-orange-800/50 rounded-xl p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 space-y-2 p-6 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "backdrop-blur-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 dark:from-orange-600/20 dark:to-amber-600/20 border border-orange-300/30 dark:border-orange-600/30 shadow-xl text-orange-900 dark:text-orange-100 font-semibold"
                      : "hover:backdrop-blur-2xl hover:bg-orange-100/10 dark:hover:bg-orange-800/20 hover:border hover:border-orange-200/20 dark:hover:border-orange-700/20 text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 hover:shadow-lg"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-600/10 dark:to-amber-600/10 rounded-xl"></div>
                  )}
                  <div className={cn(
                    "relative p-2 rounded-lg transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 shadow-lg" 
                      : "group-hover:bg-orange-200/20 dark:group-hover:bg-orange-700/20"
                  )}>
                    <Icon className={cn("h-5 w-5 transition-all duration-300", item.color)} />
                  </div>
                  <span className="relative font-medium text-base transition-all duration-300">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-lg animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Enhanced User Profile Section */}
          <div className="border-t border-orange-200/20 dark:border-orange-700/20 p-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-start space-x-4 px-4 py-4 rounded-xl transition-all duration-300 backdrop-blur-2xl bg-orange-100/10 hover:bg-orange-100/20 dark:bg-orange-800/20 dark:hover:bg-orange-800/30 border border-orange-200/20 hover:border-orange-300/30 dark:border-orange-700/20 dark:hover:border-orange-600/30 shadow-lg hover:shadow-xl text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 font-medium text-base min-h-[64px] overflow-hidden"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-orange-900 shadow-lg"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-orange-900 dark:text-orange-100 truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400 truncate">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 backdrop-blur-2xl bg-white/90 dark:bg-orange-900/90 border border-orange-200/30 dark:border-orange-700/30 shadow-2xl rounded-2xl p-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl">
                        <span className="text-white font-bold text-xl">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-orange-900 shadow-lg"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg text-orange-900 dark:text-orange-100 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-sm text-orange-600 dark:text-orange-400 truncate">
                        {user?.email || 'user@example.com'}
                      </div>
                      <div className="mt-2">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-lg",
                          user?.role === 'super_admin'
                            ? "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300 border-orange-500/40 shadow-orange-500/20"
                            : "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300 border-orange-500/40 shadow-orange-500/20"
                        )}>
                          {user?.role === 'super_admin' ? '👑 Super Admin' : '👤 User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-orange-200/30 dark:border-orange-700/40 pt-4">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 backdrop-blur-2xl bg-red-500/15 hover:bg-red-500/25 dark:bg-red-600/15 dark:hover:bg-red-600/25 border border-red-300/30 hover:border-red-400/40 dark:border-red-600/30 dark:hover:border-red-500/40 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 shadow-xl hover:shadow-2xl shadow-red-500/10 hover:shadow-red-500/20 font-semibold text-base min-h-[48px] overflow-hidden"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">Sign Out</span>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 h-full">
        {/* Enhanced Top Bar */}
        <header className="flex-shrink-0 h-20 backdrop-blur-2xl bg-white/20 dark:bg-orange-900/20 border-b border-orange-200/20 dark:border-orange-700/20 shadow-lg">
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-orange-100/20 dark:hover:bg-orange-800/50 rounded-xl p-3"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                {title && (
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-900 to-amber-800 dark:from-orange-100 dark:to-amber-200 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Enhanced Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-orange-100/20 dark:hover:bg-orange-800/50 rounded-xl p-3 transition-all duration-200">
                <div className="relative">
                  <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse shadow-lg"></span>
                </div>
              </Button>
            </div>
          </div>
        </header>

        {/* Enhanced Page Content - Full Height Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 h-full">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-orange-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

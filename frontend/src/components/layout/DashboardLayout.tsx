import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Zap, 
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/30 relative overflow-hidden flex">
      {/* Professional Background Animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle Gradient Orbs */}
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-blue-100/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-100/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-100/15 to-blue-100/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '8s'}}></div>
        
        {/* Professional Floating Elements */}
        <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/4 left-20 w-1.5 h-1.5 bg-indigo-400/25 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-purple-400/20 rounded-full animate-pulse" style={{animationDelay: '6s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-blue-300/35 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      {/* Enhanced Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col backdrop-blur-2xl bg-white/80 dark:bg-slate-900/90 border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          {/* Professional Logo Section */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200/30 dark:border-slate-700/30">
            <Link to="/dashboard" className="flex items-center space-x-4 group">
              <div className="relative">
                <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-300 group-hover:scale-110 drop-shadow-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  ScreenShot
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  SaaS Platform
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-slate-100/20 dark:hover:bg-slate-800/50 rounded-xl p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Professional Compact Navigation */}
          <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
            {sidebarItems.map((item, index) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <div key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] hover:-translate-y-0.5",
                      isActive
                        ? "backdrop-blur-2xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 dark:from-blue-600/20 dark:to-indigo-600/20 border border-blue-200/40 dark:border-blue-600/40 shadow-lg hover:shadow-xl text-blue-900 dark:text-blue-100 font-semibold"
                        : "hover:backdrop-blur-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:border hover:border-slate-200/40 dark:hover:border-slate-700/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-md"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-lg"></div>
                    )}
                    <div className={cn(
                      "relative p-1.5 rounded-md transition-all duration-300 group-hover:scale-110",
                      isActive 
                        ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 shadow-md" 
                        : "group-hover:bg-slate-200/40 dark:group-hover:bg-slate-700/40"
                    )}>
                      <Icon className={cn("h-4 w-4 transition-all duration-300", 
                        isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-blue-500"
                      )} />
                    </div>
                    <span className="relative font-medium text-sm transition-all duration-300">
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-md animate-pulse"></div>
                    )}
                  </Link>
                  {/* Visible separator between items */}
                  {index < sidebarItems.length - 1 && (
                    <div className="mx-3 my-1 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-slate-700/60"></div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Professional User Profile Section */}
          <div className="border-t border-slate-200/30 dark:border-slate-700/30 p-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-start space-x-4 px-4 py-4 rounded-xl transition-all duration-300 backdrop-blur-2xl bg-slate-100/40 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 border border-slate-200/30 hover:border-slate-300/40 dark:border-slate-700/30 dark:hover:border-slate-600/40 shadow-lg hover:shadow-xl text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 font-medium text-base min-h-[64px] overflow-hidden group"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/40 dark:border-slate-700/40 shadow-2xl rounded-2xl p-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                        <span className="text-white font-bold text-xl">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {user?.email || 'user@example.com'}
                      </div>
                      <div className="mt-2">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-lg",
                          user?.role === 'super_admin'
                            ? "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300 border-blue-500/40 shadow-blue-500/20"
                            : "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-300 border-slate-500/40 shadow-slate-500/20"
                        )}>
                          {user?.role === 'super_admin' ? '👑 Super Admin' : '👤 User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200/40 dark:border-slate-700/40 pt-4">
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
        {/* Professional Top Bar */}
        <header className="flex-shrink-0 h-20 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/30 dark:border-slate-700/30 shadow-lg">
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-slate-100/20 dark:hover:bg-slate-800/50 rounded-xl p-3 transition-all duration-200"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                {title && (
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Professional Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-slate-100/20 dark:hover:bg-slate-800/50 rounded-xl p-3 transition-all duration-200 group">
                <div className="relative">
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-200" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></span>
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
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

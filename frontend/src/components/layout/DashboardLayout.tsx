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
        <div className="flex h-full flex-col relative overflow-hidden">
          {/* Ultra Glassmorphism Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-slate-50/40 to-blue-50/35 dark:from-slate-900/40 dark:via-slate-800/50 dark:to-indigo-950/45 backdrop-blur-[40px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.15),transparent_40%)] dark:bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.25),transparent_40%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_85%,rgba(139,92,246,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_75%_85%,rgba(139,92,246,0.18),transparent_45%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.12),transparent_60%)]"></div>
          
          {/* Enhanced Border and Shadow Effects */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/80 to-transparent dark:via-slate-600/80"></div>
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/10 via-transparent to-transparent dark:from-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 dark:via-slate-800/10 dark:to-slate-700/15"></div>
          
          <div className="relative z-10 flex h-full flex-col">
            {/* Elegant Logo Section */}
            <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200/20 dark:border-slate-700/20">
              <Link to="/dashboard" className="flex items-center space-x-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Zap className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                    ScreenShot
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    Professional Platform
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-white/20 dark:hover:bg-slate-800/50 rounded-xl p-2 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Stunning Professional Navigation */}
            <nav className="flex-1 space-y-1 p-6 overflow-y-auto">
            {sidebarItems.map((item, index) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <div key={item.href} className="relative">
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-white/70 via-white/60 to-white/50 dark:from-slate-700/80 dark:via-slate-800/70 dark:to-slate-900/60 backdrop-blur-[30px] border border-white/60 dark:border-slate-500/60 shadow-2xl text-slate-900 dark:text-white font-semibold transform scale-[1.02]"
                        : "hover:bg-gradient-to-r hover:from-white/50 hover:via-white/40 hover:to-white/30 dark:hover:from-slate-800/70 dark:hover:via-slate-700/60 dark:hover:to-slate-800/50 hover:backdrop-blur-[25px] hover:border hover:border-white/40 dark:hover:border-slate-600/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:shadow-xl hover:transform hover:scale-[1.01] hover:-translate-y-0.5"
                    )}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-2xl"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full shadow-lg"></div>
                      </>
                    )}
                    
                    {/* Icon container */}
                    <div className={cn(
                      "relative p-2.5 rounded-xl transition-all duration-500 group-hover:scale-110",
                      isActive 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg" 
                        : "bg-slate-100/80 dark:bg-slate-700/80 group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-indigo-500/20 group-hover:shadow-md"
                    )}>
                      <Icon className={cn("h-5 w-5 transition-all duration-500", 
                        isActive ? "text-white drop-shadow-sm" : "text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      )} />
                      
                      {/* Icon glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-xl blur-sm"></div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className="relative font-semibold text-sm tracking-wide transition-all duration-300">
                      {item.label}
                    </span>
                    
                    {/* Active pulse indicator */}
                    {isActive && (
                      <div className="absolute right-4 w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg animate-pulse"></div>
                    )}
                    
                    {/* Hover shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </div>
                  </Link>
                  
                  {/* Elegant separator */}
                  {index < sidebarItems.length - 1 && (
                    <div className="mx-6 my-2 h-px bg-gradient-to-r from-transparent via-slate-200/40 to-transparent dark:via-slate-600/40"></div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Stunning User Profile Section */}
          <div className="border-t border-white/20 dark:border-slate-600/20 p-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-start space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 bg-gradient-to-r from-white/60 via-white/50 to-white/40 dark:from-slate-700/70 dark:via-slate-800/60 dark:to-slate-900/50 hover:from-white/80 hover:via-white/70 hover:to-white/60 dark:hover:from-slate-600/80 dark:hover:via-slate-700/70 dark:hover:to-slate-800/60 backdrop-blur-[35px] border border-white/50 hover:border-white/70 dark:border-slate-500/50 dark:hover:border-slate-400/70 shadow-2xl hover:shadow-3xl text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 font-medium text-base min-h-[72px] overflow-hidden group transform hover:scale-[1.02] hover:-translate-y-0.5"
                >
                  <div className="relative">
                    {/* Avatar with stunning effects */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-600/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                        <span className="text-white font-bold text-lg drop-shadow-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        {/* Inner glow */}
                        <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                      </div>
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-lg animate-pulse"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-base">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-2xl"></div>
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

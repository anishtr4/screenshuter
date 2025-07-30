'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Camera, 
  LayoutDashboard, 
  FolderOpen, 
  Image, 
  Settings, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Key
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

// Simplified navigation structure based on user role
const getSidebarItems = (user: any) => {
  const baseItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'text-blue-500'
    },
    {
      label: 'Projects',
      icon: FolderOpen,
      href: '/dashboard',
      color: 'text-green-500'
    }
  ]

  if (user?.role === 'super_admin') {
    baseItems.push(
      {
        label: 'Users',
        icon: Users,
        href: '/dashboard/users',
        color: 'text-red-500'
      },
      {
        label: 'Configs',
        icon: Settings,
        href: '/dashboard/configs',
        color: 'text-gray-500'
      }
    )
  } else {
    // Add API Tokens if enabled for user
    if (user?.tokenCreationEnabled) {
      baseItems.push({
        label: 'API Tokens',
        icon: Key,
        href: '/dashboard/tokens',
        color: 'text-purple-500'
      })
    }
  }
  
  return baseItems
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
  }

  const sidebarItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen, color: 'text-purple-500' },
    ...(user?.tokenCreationEnabled ? [
      { href: '/dashboard/tokens', label: 'API Keys', icon: Key, color: 'text-amber-500' },
    ] : []),
    ...(user?.role === 'super_admin' ? [
      { href: '/dashboard/users', label: 'Users', icon: Users, color: 'text-green-500' },
      { href: '/dashboard/configs', label: 'Configs', icon: Settings, color: 'text-orange-500' },
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
        
        {/* Flowing Wave Patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="globalFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(251 146 60)" stopOpacity="0.1" />
                <stop offset="50%" stopColor="rgb(245 158 11)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="rgb(251 146 60)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,10 Q25,5 50,15 T100,20 L100,25 Q75,30 50,20 T0,15 Z" fill="url(#globalFlowGradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0;5,3;0,0" dur="8s" repeatCount="indefinite" />
            </path>
            <path d="M0,40 Q25,45 50,35 T100,50 L100,55 Q75,50 50,40 T0,45 Z" fill="url(#globalFlowGradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0;-3,-2;0,0" dur="10s" repeatCount="indefinite" />
            </path>
            <path d="M0,70 Q25,75 50,65 T100,80 L100,85 Q75,80 50,70 T0,75 Z" fill="url(#globalFlowGradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0;4,2;0,0" dur="12s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 flex h-full w-full">
        {/* Enhanced Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col backdrop-blur-2xl bg-gradient-to-br from-orange-50/80 via-amber-50/70 to-orange-100/80 dark:from-orange-900/80 dark:via-amber-900/70 dark:to-orange-800/80 border-r border-orange-200/30 dark:border-orange-700/30 shadow-2xl relative overflow-hidden">
            {/* Animated Background Patterns */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Floating Orbs */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-orange-300/10 to-amber-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
              
              {/* Animated Geometric Patterns */}
              <div className="absolute top-20 right-10 w-4 h-4 bg-orange-400/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-40 left-10 w-2 h-2 bg-amber-400/40 rounded-full animate-bounce" style={{animationDelay: '3s'}}></div>
              <div className="absolute bottom-40 right-20 w-3 h-3 bg-orange-300/35 rounded-full animate-bounce" style={{animationDelay: '5s'}}></div>
              
              {/* Flowing Lines */}
              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(251 146 60)" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="rgb(245 158 11)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="rgb(251 146 60)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path d="M0,20 Q50,10 100,30 L100,35 Q50,15 0,25 Z" fill="url(#flowGradient)">
                    <animateTransform attributeName="transform" type="translate" values="0,0;10,5;0,0" dur="6s" repeatCount="indefinite" />
                  </path>
                  <path d="M0,60 Q50,70 100,50 L100,55 Q50,75 0,65 Z" fill="url(#flowGradient)">
                    <animateTransform attributeName="transform" type="translate" values="0,0;-10,-5;0,0" dur="8s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            </div>

            {/* Enhanced Logo Section */}
            <div className="relative z-10 flex items-center justify-between h-20 px-6 border-b border-orange-200/20 dark:border-orange-700/30">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl blur opacity-75"></div>
                  <div className="relative p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg">
                    <Camera className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Screenshot
                  </span>
                  <span className="text-sm font-medium text-orange-600/70 dark:text-orange-400/70">
                    SaaS Platform
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-white/20 dark:hover:bg-slate-800/50"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>



          {/* Enhanced Professional Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-500 ease-out group relative overflow-hidden backdrop-blur-xl transform hover:scale-[1.02] hover:translate-x-1",
                    isActive 
                      ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 dark:from-orange-600/30 dark:to-amber-600/30 border border-orange-400/30 dark:border-orange-500/40 shadow-lg shadow-orange-500/10 scale-[1.02] translate-x-1" 
                      : "bg-white/5 dark:bg-orange-800/5 hover:bg-gradient-to-r hover:from-orange-500/15 hover:to-amber-500/15 dark:hover:from-orange-600/20 dark:hover:to-amber-600/20 border border-white/5 dark:border-orange-700/10 hover:border-orange-300/30 dark:hover:border-orange-600/30 shadow-sm hover:shadow-lg hover:shadow-orange-500/10"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {/* Professional Icon Container */}
                  <div className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-500 ease-out backdrop-blur-xl transform group-hover:scale-110 group-hover:rotate-3",
                    isActive 
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 scale-110" 
                      : "bg-gradient-to-r from-white/15 to-white/10 dark:from-orange-600/20 dark:to-amber-600/15 group-hover:from-orange-500/40 group-hover:to-amber-500/40 dark:group-hover:from-orange-500/50 dark:group-hover:to-amber-500/50 shadow-md group-hover:shadow-lg group-hover:shadow-orange-500/20"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-all duration-500 ease-out transform group-hover:scale-110",
                      isActive 
                        ? "text-white drop-shadow-sm scale-110" 
                        : "text-orange-600 dark:text-orange-400 group-hover:text-white dark:group-hover:text-white"
                    )} />
                  </div>
                  
                  {/* Professional Label */}
                  <span className={cn(
                    "font-medium text-sm transition-all duration-500 ease-out transform group-hover:translate-x-1",
                    isActive 
                      ? "text-orange-900 dark:text-orange-100 translate-x-1" 
                      : "text-orange-700 dark:text-orange-300 group-hover:text-orange-900 dark:group-hover:text-orange-100 group-hover:font-semibold"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  <div className={cn(
                    "absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-600 rounded-r-full transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0"
                  )}></div>
                  
                  {/* Subtle Glow Effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-lg animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Enhanced Professional User Profile & Logout */}
          <div className="px-4 py-6 border-t border-orange-200/30 dark:border-orange-700/40 backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10 dark:from-orange-900/20 dark:to-amber-900/10">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center space-x-3 px-3 py-4 rounded-xl transition-all duration-300 backdrop-blur-2xl bg-white/15 dark:bg-orange-800/15 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-amber-500/20 dark:hover:from-orange-600/25 dark:hover:to-amber-600/25 border border-white/20 dark:border-orange-700/30 hover:border-orange-300/40 dark:hover:border-orange-600/40 shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 group relative overflow-hidden min-h-[80px]"
                >
                  {/* Enhanced User Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full blur-sm opacity-60"></div>
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-xl shadow-orange-500/30">
                      <span className="text-white font-bold text-xl drop-shadow-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced User Info */}
                  <div className="flex-1 min-w-0 text-left space-y-2 overflow-hidden">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 break-all leading-tight tracking-wide">
                      {user?.email}
                    </p>
                    <div className="flex items-center">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm border whitespace-nowrap",
                        user?.role === 'super_admin' 
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300 border-red-500/30"
                          : "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300 border-orange-500/30"
                      )}>
                        {user?.role === 'super_admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Menu Indicator */}
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 backdrop-blur-xl bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/20 group-hover:from-orange-500/30 group-hover:to-amber-500/30 dark:group-hover:from-orange-500/40 dark:group-hover:to-amber-500/40 shadow-lg flex-shrink-0">
                    <div className="flex flex-col space-y-0.5">
                      <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              
              <PopoverContent 
                className="p-6 backdrop-blur-2xl bg-white/90 dark:bg-gray-900/90 border border-orange-200/40 dark:border-orange-700/40 shadow-2xl shadow-orange-500/10 rounded-xl" 
                side="right" 
                align="end"
                style={{ width: '320px', maxWidth: '90vw' }}
              >
                {/* Enhanced Detailed User Profile */}
                <div className="space-y-6 overflow-hidden">
                  <div className="flex items-start space-x-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full blur-sm opacity-60"></div>
                      <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                        <span className="text-white font-bold text-2xl drop-shadow-sm">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                      <p className="text-base font-bold text-orange-900 dark:text-orange-100 break-all tracking-wide leading-tight">
                        {user?.email}
                      </p>
                      <div className="flex items-center">
                        <span className={cn(
                          "text-xs px-3 py-1 rounded-lg font-semibold backdrop-blur-xl border shadow-lg whitespace-nowrap",
                          user?.role === 'super_admin' 
                            ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300 border-red-500/40 shadow-red-500/20"
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
      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300 h-full">
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
          <div className="p-8 h-full">
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
    </div>
  )
}

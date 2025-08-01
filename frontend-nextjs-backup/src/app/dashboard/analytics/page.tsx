'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Camera,
  FolderOpen,
  Clock,
  Users,
  Globe,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

const analyticsData = {
  totalScreenshots: 156,
  totalProjects: 12,
  avgProcessingTime: '2.3s',
  successRate: 98.5,
  monthlyGrowth: 15.2,
  weeklyStats: [
    { day: 'Mon', screenshots: 12 },
    { day: 'Tue', screenshots: 19 },
    { day: 'Wed', screenshots: 8 },
    { day: 'Thu', screenshots: 15 },
    { day: 'Fri', screenshots: 22 },
    { day: 'Sat', screenshots: 6 },
    { day: 'Sun', screenshots: 4 }
  ],
  topDomains: [
    { domain: 'example.com', count: 45 },
    { domain: 'blog.example.com', count: 32 },
    { domain: 'shop.example.com', count: 28 },
    { domain: 'docs.example.com', count: 21 },
    { domain: 'api.example.com', count: 15 }
  ],
  recentActivity: [
    { action: 'Screenshot captured', target: 'example.com/products', time: '2 minutes ago' },
    { action: 'Project created', target: 'Mobile App Screenshots', time: '1 hour ago' },
    { action: 'Crawl completed', target: 'blog.example.com', time: '3 hours ago' },
    { action: 'Screenshot captured', target: 'shop.example.com/cart', time: '5 hours ago' }
  ]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, token } = useAuth()

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login')
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const maxScreenshots = Math.max(...analyticsData.weeklyStats.map(stat => stat.screenshots))

  return (
    <DashboardLayout title="Analytics" subtitle="Insights into your screenshot activity">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <GlassCard className="hover:scale-105 transition-transform duration-200">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Screenshots
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.totalScreenshots}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +{analyticsData.monthlyGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform duration-200">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.totalProjects}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +8.3%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform duration-200">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Processing Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.avgProcessingTime}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500 rotate-180" />
                  <span className="text-sm font-medium text-green-600">
                    -12%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform duration-200">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.successRate}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +2.1%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Weekly Activity</GlassCardTitle>
            <GlassCardDescription>
              Screenshots captured this week
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {analyticsData.weeklyStats.map((stat, index) => (
                <div key={stat.day} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.day}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(stat.screenshots / maxScreenshots) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {stat.screenshots}
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Top Domains */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Top Domains</GlassCardTitle>
            <GlassCardDescription>
              Most frequently captured websites
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {analyticsData.topDomains.map((domain, index) => (
                <div key={domain.domain} className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {domain.domain}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {domain.count}
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Recent Activity</GlassCardTitle>
            <GlassCardDescription>
              Latest actions in your account
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activity.target}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}

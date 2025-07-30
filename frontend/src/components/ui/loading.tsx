'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-orange-200 border-t-orange-500',
      sizeClasses[size],
      className
    )} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            'bg-orange-100 dark:bg-orange-900/20 rounded-lg',
            i === 0 ? 'h-4' : 'h-3 mt-2',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-orange-600 dark:text-orange-400 font-medium">{message}</p>
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 6, className }: CardSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-orange-200/30 dark:border-orange-700/30 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-200 dark:bg-orange-900/30 rounded-lg" />
            <div className="w-8 h-8 bg-orange-200 dark:bg-orange-900/30 rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="h-5 bg-orange-200 dark:bg-orange-900/30 rounded-lg w-3/4" />
            <div className="h-4 bg-orange-200 dark:bg-orange-900/30 rounded-lg" />
            <div className="h-4 bg-orange-200 dark:bg-orange-900/30 rounded-lg w-1/2" />
            <div className="flex justify-between pt-2">
              <div className="h-3 bg-orange-200 dark:bg-orange-900/30 rounded-lg w-16" />
              <div className="h-3 bg-orange-200 dark:bg-orange-900/30 rounded-lg w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

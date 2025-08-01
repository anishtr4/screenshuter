import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ProgressCardProps {
  title: string
  url?: string
  status: 'processing' | 'completed' | 'failed' | 'pending'
  progress?: number
  stage?: string
  error?: string
  type?: 'screenshot' | 'collection'
  screenshotCount?: number
  completedCount?: number
}

export function ProgressCard({
  title,
  url,
  status,
  progress = 0,
  stage,
  error,
  type = 'screenshot',
  screenshotCount,
  completedCount
}: ProgressCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Camera className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <Card className={`${getStatusColor()} transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {title}
              </h3>
              {url && (
                <p className="text-xs text-gray-500 truncate mt-1">
                  {url}
                </p>
              )}
            </div>
          </div>
          <Badge 
            variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {status}
          </Badge>
        </div>

        {/* Progress Bar */}
        {(status === 'processing' || status === 'completed') && (
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2"
              // @ts-ignore - custom progress color
              style={{
                '--progress-background': getProgressColor()
              } as React.CSSProperties}
            />
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{progress}%</span>
              {type === 'collection' && screenshotCount && (
                <span>{completedCount || 0}/{screenshotCount} screenshots</span>
              )}
            </div>
          </div>
        )}

        {/* Stage Information */}
        {stage && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 truncate">
              {stage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'failed' && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Processing Animation */}
        {status === 'processing' && (
          <div className="mt-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

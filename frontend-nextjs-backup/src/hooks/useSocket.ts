import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

interface ScreenshotProgress {
  screenshotId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  stage: string
  imagePath?: string
  thumbnailPath?: string
  metadata?: any
  error?: string
}

interface CollectionProgress {
  collectionId: string
  totalScreenshots: number
  completedScreenshots: number
  progress: number
  stage: string
}

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [screenshotProgress, setScreenshotProgress] = useState<Record<string, ScreenshotProgress>>({})
  const [collectionProgress, setCollectionProgress] = useState<Record<string, CollectionProgress>>({})

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    socketRef.current = socket

    socket.on('connect', () => {

      setIsConnected(true)
      
      // Join user-specific room
      socket.emit('join-user-room', user.id)
    })

    socket.on('disconnect', () => {

      setIsConnected(false)
    })

    // Listen for screenshot progress updates
    socket.on('screenshot-progress', (data: ScreenshotProgress) => {
      // IGNORE individual screenshot progress to prevent collection screenshots from appearing
      // Only log for debugging
      console.log('Screenshot progress received (IGNORED):', data.screenshotId, data.status);
      
      // Do NOT update screenshotProgress state to prevent any UI updates
      // setScreenshotProgress(prev => ({
      //   ...prev,
      //   [data.screenshotId]: data
      // }))
    })

    // Listen for collection progress updates
    socket.on('collection-progress', (data: CollectionProgress) => {
      console.log('Collection progress received:', data.collectionId, data.progress + '%', data.stage);
      
      setCollectionProgress(prev => ({
        ...prev,
        [data.collectionId]: data
      }))
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isAuthenticated, user])

  const clearScreenshotProgress = (screenshotId: string) => {
    setScreenshotProgress(prev => {
      const newState = { ...prev }
      delete newState[screenshotId]
      return newState
    })
  }

  const clearCollectionProgress = (collectionId: string) => {
    setCollectionProgress(prev => {
      const newState = { ...prev }
      delete newState[collectionId]
      return newState
    })
  }

  return {
    socket: socketRef.current,
    isConnected,
    screenshotProgress,
    collectionProgress,
    clearScreenshotProgress,
    clearCollectionProgress
  }
}

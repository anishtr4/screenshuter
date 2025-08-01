import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [screenshotProgress, setScreenshotProgress] = useState<Record<string, ScreenshotProgress>>({})
  const [collectionProgress, setCollectionProgress] = useState<Record<string, CollectionProgress>>({})

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Initialize socket connection
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      auth: {
        token
      }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setIsConnected(true)
      
      // Join user-specific room
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.id) {
        socket.emit('join-user-room', user.id)
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // Listen for screenshot progress updates
    socket.on('screenshot-progress', (data: ScreenshotProgress) => {
      console.log('🚀 Screenshot progress received:', {
        screenshotId: data.screenshotId,
        status: data.status,
        progress: data.progress + '%',
        stage: data.stage,
        metadata: data.metadata,
        fullData: data
      })
      
      setScreenshotProgress(prev => ({
        ...prev,
        [data.screenshotId]: data
      }))
    })

    // Listen for collection progress updates
    socket.on('collection-progress', (data: CollectionProgress) => {
      console.log('📚 Collection progress received:', {
        collectionId: data.collectionId,
        progress: data.progress + '%',
        stage: data.stage,
        completedScreenshots: data.completedScreenshots,
        totalScreenshots: data.totalScreenshots,
        fullData: data
      })
      
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
  }, [])

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

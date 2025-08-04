import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ScreenshotProgress {
  screenshotId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  stage: string
  url?: string // URL of the screenshot for completed events
  imagePath?: string
  thumbnailPath?: string
  createdAt?: string // Actual creation date from database
  type?: string // Add type for filtering
  collectionId?: string // Add collectionId for filtering
  metadata?: any
  error?: string
}

interface CollectionProgress {
  collectionId: string
  totalScreenshots: number
  completedScreenshots: number
  progress: number
  stage: string
  url?: string // URL being processed
  type?: 'crawl' | 'frame' // Type of collection
  startTime?: number // When collection started
  isScrolling?: boolean // Optional flag to indicate if auto-scroll is in progress
  completed?: boolean // Flag to indicate if collection is fully completed
}

// Helper functions for persistence
const COLLECTION_PROGRESS_KEY = 'collectionProgress'

const saveCollectionProgress = (progress: Record<string, CollectionProgress>) => {
  localStorage.setItem('collectionProgress', JSON.stringify(progress))
}

const clearAllCollectionProgress = () => {
  try {
    localStorage.removeItem(COLLECTION_PROGRESS_KEY)
    console.log('🧹 Cleared all collection progress from localStorage')
  } catch (error) {
    console.error('Error clearing collection progress:', error)
  }
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [screenshotProgress, setScreenshotProgress] = useState<Record<string, ScreenshotProgress>>({})
  // Clear old collection progress data on mount to start fresh
  const [collectionProgress, setCollectionProgress] = useState<Record<string, CollectionProgress>>(() => {
    // Clear old data and start fresh
    clearAllCollectionProgress()
    return {}
  })

  useEffect(() => {
    console.log('🚀 useSocket effect starting...')
    // Get auth token from localStorage
    const token = localStorage.getItem('token')
    console.log('🔑 Auth token:', token ? 'Found' : 'Not found')
    
    if (!token) {
      console.warn('No auth token found')
      return
    }

    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8003'
    console.log('🌐 Socket URL:', socketUrl)
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      auth: {
        token
      }
    })
    
    console.log('🔧 Socket instance created:', socket.id)

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)
      setIsConnected(true)
      
      // Join user-specific room
      const userString = localStorage.getItem('user')
      console.log('🔍 Raw user data from localStorage:', userString)
      
      const user = JSON.parse(userString || '{}')
      console.log('🔍 Parsed user data:', user)
      console.log('🔍 User ID:', user.id)
      console.log('🔍 User ID type:', typeof user.id)
      
      if (user.id) {
        console.log('📫 Joining user room:', user.id)
        console.log('📫 Expected backend room:', `user-${user.id}`)
        socket.emit('join-user-room', user.id)
      } else {
        console.warn('⚠️ No user ID found for room joining')
        console.warn('⚠️ Available user keys:', Object.keys(user))
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
        timestamp: new Date().toISOString(),
        fullData: data
      })
      
      // DEBUG: Track if this is a duplicate event
      setScreenshotProgress(prev => {
        const existing = prev[data.screenshotId]
        if (existing) {
          console.log('🔄 UPDATING existing screenshot progress:', {
            screenshotId: data.screenshotId,
            oldProgress: existing.progress + '%',
            newProgress: data.progress + '%',
            oldStage: existing.stage,
            newStage: data.stage
          })
        } else {
          console.log('✨ NEW screenshot progress entry:', {
            screenshotId: data.screenshotId,
            progress: data.progress + '%',
            stage: data.stage
          })
        }
        
        return {
          ...prev,
          [data.screenshotId]: data
        }
      })
    })

    // Listen for collection progress updates
    console.log('🔊 Setting up collection-progress event listener...')
    socket.on('collection-progress', (data: CollectionProgress) => {
      console.log('📚 📚 📚 COLLECTION PROGRESS EVENT RECEIVED!!! 📚 📚 📚')
      console.log('📚 Collection progress received:', {
        collectionId: data.collectionId,
        progress: data.progress + '%',
        stage: data.stage,
        completedScreenshots: data.completedScreenshots,
        totalScreenshots: data.totalScreenshots,
        type: data.type,
        url: data.url,
        startTime: data.startTime,
        completed: data.completed,
        fullData: data
      })
      
      // Debug: Check if required fields are present
      if (!data.type || !data.url) {
        console.warn('⚠️ Collection progress missing required fields:', {
          hasType: !!data.type,
          hasUrl: !!data.url,
          data
        })
      }
      
      // Add start time if not present
      const enhancedData = {
        ...data,
        startTime: data.startTime || Date.now()
      }
      
      setCollectionProgress(prev => {
        const updated = {
          ...prev,
          [data.collectionId]: enhancedData
        }
        // Save to localStorage for persistence
        saveCollectionProgress(updated)
        return updated
      })
    })

    // Handle collection progress clear events
    console.log('🔊 Setting up collection-progress-clear event listener...')
    socket.on('collection-progress-clear', (data: { collectionId: string }) => {
      console.log('🧹 🧹 🧹 COLLECTION PROGRESS CLEAR EVENT RECEIVED!!! 🧹 🧹 🧹')
      console.log('🧹 Collection progress clear received:', data);
      setCollectionProgress(prev => {
        const updated = { ...prev };
        delete updated[data.collectionId];
        saveCollectionProgress(updated);
        return updated;
      });
    });

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
      // Update localStorage
      saveCollectionProgress(newState)
      return newState
    })
  }

  return {
    socket: socketRef.current,
    isConnected,
    screenshotProgress,
    collectionProgress,
    clearScreenshotProgress,
    clearCollectionProgress,
    clearAllCollectionProgress
  }
}

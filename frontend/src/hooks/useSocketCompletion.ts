import { useEffect, useRef } from 'react'
import { useSocket } from './useSocket'

/**
 * Custom hook that only listens to screenshot and collection completion events
 * without subscribing to progress updates. This prevents unnecessary re-renders
 * during progress updates.
 */
export const useSocketCompletion = (
  onScreenshotCompleted?: (data: any) => void,
  onCollectionCompleted?: (data: any) => void,
  onCollectionFailed?: (data: any) => void
) => {
  const { socket, isConnected } = useSocket()
  const processedScreenshotsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!socket) return

    const handleScreenshotCompleted = (data: any) => {
      console.log('Screenshot completed:', data.screenshotId)
      if (processedScreenshotsRef.current.has(data.screenshotId)) {
        return
      }
      processedScreenshotsRef.current.add(data.screenshotId)
      
      // Call the provided callback
      onScreenshotCompleted?.(data)
      
      // Clean up tracking after delay
      setTimeout(() => {
        processedScreenshotsRef.current.delete(data.screenshotId)
      }, 1500)
    }

    const handleCollectionCompleted = (data: any) => {
      console.log('Collection completed:', data.collectionId)
      onCollectionCompleted?.(data)
    }

    const handleCollectionFailed = (data: any) => {
      console.log('Collection failed:', data.collectionId)
      onCollectionFailed?.(data)
    }

    // Listen only to completion events
    socket.on('screenshotCompleted', handleScreenshotCompleted)
    socket.on('collectionCompleted', handleCollectionCompleted)
    socket.on('collectionFailed', handleCollectionFailed)

    return () => {
      socket.off('screenshotCompleted', handleScreenshotCompleted)
      socket.off('collectionCompleted', handleCollectionCompleted)
      socket.off('collectionFailed', handleCollectionFailed)
    }
  }, [socket, onScreenshotCompleted, onCollectionCompleted, onCollectionFailed])

  return {
    isConnected
  }
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseStableImageUrlsOptions {
  token?: string
}

export function useStableImageUrls(options: UseStableImageUrlsOptions = {}) {
  const { token } = options
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const cacheRef = useRef<Record<string, string>>({})
  const loadingRef = useRef<Set<string>>(new Set())

  const loadImageUrl = useCallback(async (screenshotId: string, type: 'full' | 'thumbnail' = 'thumbnail') => {
    if (!token || !screenshotId) return null

    // Return cached URL if available
    if (cacheRef.current[screenshotId]) {
      return cacheRef.current[screenshotId]
    }

    // Prevent duplicate loading
    if (loadingRef.current.has(screenshotId)) {
      return null
    }

    loadingRef.current.add(screenshotId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${screenshotId}?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        
        // Store in cache
        cacheRef.current[screenshotId] = blobUrl
        
        // Update state
        setImageUrls(prev => ({
          ...prev,
          [screenshotId]: blobUrl
        }))

        return blobUrl
      }
    } catch (error) {
      console.error(`Failed to load image for ${screenshotId}:`, error)
    } finally {
      loadingRef.current.delete(screenshotId)
    }

    return null
  }, [token])

  const loadMultipleImageUrls = useCallback(async (screenshotIds: string[], type: 'full' | 'thumbnail' = 'thumbnail') => {
    if (!token || !screenshotIds.length) return

    const promises = screenshotIds
      .filter(id => !cacheRef.current[id] && !loadingRef.current.has(id))
      .map(id => loadImageUrl(id, type))

    await Promise.all(promises)
  }, [token, loadImageUrl])

  const getImageUrl = useCallback((screenshotId: string) => {
    return cacheRef.current[screenshotId] || imageUrls[screenshotId] || null
  }, [imageUrls])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(cacheRef.current).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  return {
    imageUrls,
    loadImageUrl,
    loadMultipleImageUrls,
    getImageUrl
  }
}

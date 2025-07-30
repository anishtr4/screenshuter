import { create } from 'zustand'
import { Project, Screenshot, Collection } from '@/types'

interface ProjectStore {
  // Current project data
  currentProject: Project | null
  screenshots: Screenshot[]
  collections: Collection[]
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentProject: (project: Project | null) => void
  setScreenshots: (screenshots: Screenshot[]) => void
  setCollections: (collections: Collection[]) => void
  addScreenshot: (screenshot: Screenshot) => void
  updateScreenshot: (id: string, updates: Partial<Screenshot>) => void
  removeScreenshot: (id: string) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  removeCollection: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  currentProject: null,
  screenshots: [],
  collections: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  setScreenshots: (screenshots) => {
    set({ screenshots })
  },

  setCollections: (collections) => {
    set({ collections })
  },

  addScreenshot: (screenshot) => {
    set((state) => ({
      screenshots: [screenshot, ...state.screenshots]
    }))
  },

  updateScreenshot: (id, updates) => {
    set((state) => ({
      screenshots: state.screenshots.map((screenshot) =>
        screenshot.id === id ? { ...screenshot, ...updates } : screenshot
      )
    }))
  },

  removeScreenshot: (id) => {
    set((state) => ({
      screenshots: state.screenshots.filter((screenshot) => screenshot.id !== id)
    }))
  },

  addCollection: (collection) => {
    set((state) => ({
      collections: [collection, ...state.collections]
    }))
  },

  updateCollection: (id, updates) => {
    set((state) => ({
      collections: state.collections.map((collection) =>
        collection.id === id ? { ...collection, ...updates } : collection
      )
    }))
  },

  removeCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((collection) => collection.id !== id)
    }))
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  reset: () => {
    set({
      currentProject: null,
      screenshots: [],
      collections: [],
      isLoading: false,
      error: null,
    })
  },
}))

// Selector hooks for better performance
export const useCurrentProject = () => useProjectStore((state) => state.currentProject)
export const useScreenshots = () => useProjectStore((state) => state.screenshots)
export const useCollections = () => useProjectStore((state) => state.collections)
export const useProjectLoading = () => useProjectStore((state) => state.isLoading)
export const useProjectError = () => useProjectStore((state) => state.error)

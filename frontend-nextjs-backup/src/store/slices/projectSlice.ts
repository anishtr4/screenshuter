import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Project, Screenshot, Collection } from '@/types'

interface ProjectState {
  // Current project data
  currentProject: Project | null
  screenshots: Screenshot[]
  collections: Collection[]
  
  // UI state
  isLoading: boolean
  error: string | null
}

const initialState: ProjectState = {
  currentProject: null,
  screenshots: [],
  collections: [],
  isLoading: false,
  error: null,
}

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    setScreenshots: (state, action: PayloadAction<Screenshot[]>) => {
      state.screenshots = action.payload
    },
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      state.collections = action.payload
    },
    addScreenshot: (state, action: PayloadAction<Screenshot>) => {
      state.screenshots.unshift(action.payload)
    },
    updateScreenshot: (state, action: PayloadAction<{ id: string; updates: Partial<Screenshot> }>) => {
      const { id, updates } = action.payload
      const index = state.screenshots.findIndex(screenshot => 
        screenshot.id === id || screenshot._id === id
      )
      if (index !== -1) {
        state.screenshots[index] = { ...state.screenshots[index], ...updates }
      }
    },
    removeScreenshot: (state, action: PayloadAction<string>) => {
      state.screenshots = state.screenshots.filter(screenshot => 
        screenshot.id !== action.payload && screenshot._id !== action.payload
      )
    },
    addCollection: (state, action: PayloadAction<Collection>) => {
      state.collections.unshift(action.payload)
    },
    updateCollection: (state, action: PayloadAction<{ id: string; updates: Partial<Collection> }>) => {
      const { id, updates } = action.payload
      const index = state.collections.findIndex(collection => collection.id === id)
      if (index !== -1) {
        state.collections[index] = { ...state.collections[index], ...updates }
      }
    },
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter(collection => collection.id !== action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    resetProject: (state) => {
      state.currentProject = null
      state.screenshots = []
      state.collections = []
      state.isLoading = false
      state.error = null
    },
  },
})

export const {
  setCurrentProject,
  setScreenshots,
  setCollections,
  addScreenshot,
  updateScreenshot,
  removeScreenshot,
  addCollection,
  updateCollection,
  removeCollection,
  setLoading,
  setError,
  resetProject,
} = projectSlice.actions

export default projectSlice.reducer

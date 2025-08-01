import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
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
} from '@/store/slices/projectSlice'
import { Project, Screenshot, Collection } from '@/types'

export const useProject = () => {
  const dispatch = useAppDispatch()
  const {
    currentProject,
    screenshots,
    collections,
    isLoading,
    error,
  } = useAppSelector((state) => state.project)

  return {
    // State
    currentProject,
    screenshots,
    collections,
    isLoading,
    error,

    // Actions
    setCurrentProject: (project: Project | null) => dispatch(setCurrentProject(project)),
    setScreenshots: (screenshots: Screenshot[]) => dispatch(setScreenshots(screenshots)),
    setCollections: (collections: Collection[]) => dispatch(setCollections(collections)),
    addScreenshot: (screenshot: Screenshot) => dispatch(addScreenshot(screenshot)),
    updateScreenshot: (id: string, updates: Partial<Screenshot>) => 
      dispatch(updateScreenshot({ id, updates })),
    removeScreenshot: (id: string) => dispatch(removeScreenshot(id)),
    addCollection: (collection: Collection) => dispatch(addCollection(collection)),
    updateCollection: (id: string, updates: Partial<Collection>) => 
      dispatch(updateCollection({ id, updates })),
    removeCollection: (id: string) => dispatch(removeCollection(id)),
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setError: (error: string | null) => dispatch(setError(error)),
    reset: () => dispatch(resetProject()),
  }
}

// Selector hooks for better performance (similar to Zustand selectors)
export const useCurrentProject = () => useAppSelector((state) => state.project.currentProject)
export const useScreenshots = () => useAppSelector((state) => state.project.screenshots)
export const useCollections = () => useAppSelector((state) => state.project.collections)
export const useProjectLoading = () => useAppSelector((state) => state.project.isLoading)
export const useProjectError = () => useAppSelector((state) => state.project.error)

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, X } from 'lucide-react'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description?: string) => void
  loading?: boolean
}

export function AddProjectModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: AddProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (projectName.trim()) {
      onSubmit(projectName.trim(), projectDescription.trim() || undefined)
      setProjectName('')
      setProjectDescription('')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setProjectName('')
      setProjectDescription('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/20 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-orange-900/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto backdrop-blur-2xl bg-white/30 dark:bg-orange-900/40 border border-orange-200/30 dark:border-orange-700/30 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100">
              Create New Project
            </h2>
            <p className="text-orange-700 dark:text-orange-300 text-sm">
              Create a new project to organize your screenshots
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="hover:bg-orange-100/20 dark:hover:bg-orange-800/20 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-600 dark:placeholder-orange-400 transition-all duration-200"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && projectName.trim()) {
                  handleSubmit()
                }
              }}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 block">
              Description (Optional)
            </label>
            <textarea
              placeholder="Enter project description..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-orange-900 dark:text-orange-100 placeholder-orange-600 dark:placeholder-orange-400 transition-all duration-200 resize-none"
              rows={3}
              disabled={loading}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 rounded-xl hover:bg-white/40 dark:hover:bg-orange-800/40 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!projectName.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

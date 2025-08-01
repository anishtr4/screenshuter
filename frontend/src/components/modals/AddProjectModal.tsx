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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-900 to-amber-800 dark:from-orange-100 dark:to-amber-200 bg-clip-text text-transparent">
              Create New Project
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="h-8 w-8 p-0 hover:bg-orange-100/50 dark:hover:bg-orange-800/50 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full px-4 py-3 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-orange-900/20 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-orange-900 dark:text-orange-100 placeholder-orange-600/50 dark:placeholder-orange-400/50"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-orange-200/50 dark:border-orange-700/50 bg-white/50 dark:bg-orange-900/20 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-orange-900 dark:text-orange-100 placeholder-orange-600/50 dark:placeholder-orange-400/50 resize-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-orange-200 hover:bg-orange-50 text-orange-700 dark:border-orange-700 dark:hover:bg-orange-900/20 dark:text-orange-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!projectName.trim() || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  )
}

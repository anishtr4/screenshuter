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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Create New Project
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="h-8 w-8 p-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-900 dark:text-slate-100 placeholder-slate-500/70 transition-all duration-200 shadow-sm"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-900 dark:text-slate-100 placeholder-slate-500/70 resize-none transition-all duration-200 shadow-sm"
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
            className="border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800/20 dark:text-slate-300 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!projectName.trim() || loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  )
}

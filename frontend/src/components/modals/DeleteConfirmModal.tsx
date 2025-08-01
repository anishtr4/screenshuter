import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  title: string
  message: string
  confirmText?: string
  type?: 'danger' | 'warning'
}

export const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false, 
  title, 
  message, 
  confirmText = 'Delete',
  type = 'danger'
}: DeleteConfirmModalProps) => {
  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-white/10 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                type === 'danger' 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  type === 'danger' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="px-6 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-6 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'danger'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

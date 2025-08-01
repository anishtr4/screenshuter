import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, UserX, KeyRound, Shield } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: 'delete' | 'user' | 'key' | 'shield' | 'warning'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon = 'warning',
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (icon) {
      case 'delete':
        return <Trash2 className="h-6 w-6" />
      case 'user':
        return <UserX className="h-6 w-6" />
      case 'key':
        return <KeyRound className="h-6 w-6" />
      case 'shield':
        return <Shield className="h-6 w-6" />
      default:
        return <AlertTriangle className="h-6 w-6" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={loading ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${getIconBg()}`}>
            {getIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={getConfirmButtonStyle()}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

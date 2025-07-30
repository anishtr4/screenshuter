'use client'

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
        return 'bg-gradient-to-r from-red-500 to-red-600'
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500'
      default:
        return 'bg-gradient-to-r from-orange-500 to-amber-600'
    }
  }

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
      default:
        return 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/20 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-orange-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto backdrop-blur-2xl bg-white/30 dark:bg-orange-900/40 border border-orange-200/30 dark:border-orange-700/30 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${getIconBg()} text-white shadow-lg`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100">
              {title}
            </h3>
            <p className="text-orange-700 dark:text-orange-300 mt-1">
              {description}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-orange-800 dark:text-orange-200 bg-white/30 dark:bg-orange-800/30 border border-orange-200/30 dark:border-orange-700/30 rounded-xl hover:bg-white/40 dark:hover:bg-orange-800/40 transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${getConfirmButtonStyle()}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

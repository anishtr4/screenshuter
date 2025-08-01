import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setAuth, clearAuth } from '@/store/slices/authSlice'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, token, isAuthenticated, limits } = useAppSelector((state) => state.auth)

  // Validate authentication state on mount
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user: !!user, token: !!token })
    
    // Clear localStorage token if we have inconsistent state
    if (isAuthenticated && !user) {
      console.log('Clearing invalid auth state - no user data')
      localStorage.removeItem('token')
      dispatch(clearAuth())
    }
    
    // If we have a token but no user data, clear everything
    if (token && !user) {
      console.log('Clearing invalid auth state - token without user')
      localStorage.removeItem('token')
      dispatch(clearAuth())
    }
    
    // If we have neither token nor user but think we're authenticated, clear state
    if (isAuthenticated && !token && !user) {
      console.log('Clearing completely invalid auth state')
      localStorage.removeItem('token')
      dispatch(clearAuth())
    }
  }, [isAuthenticated, user, token, dispatch])

  const login = (userData: any, authToken: string, userLimits?: any) => {
    dispatch(setAuth({ 
      user: userData, 
      token: authToken, 
      limits: userLimits 
    }))
  }

  const logout = () => {
    dispatch(clearAuth())
    router.push('/auth/login')
  }

  // Check if user is authenticated and redirect if not
  const requireAuth = () => {
    useEffect(() => {
      if (!isAuthenticated || !token) {
        router.push('/auth/login')
      }
    }, [isAuthenticated, token, router])
  }

  return {
    user,
    token,
    isAuthenticated,
    limits,
    login,
    logout,
    requireAuth
  }
}

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setAuth, clearAuth } from '@/store/slices/authSlice'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, token, isAuthenticated, limits } = useAppSelector((state) => state.auth)

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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { Camera, Eye, EyeOff } from 'lucide-react'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.signup(data.email, data.password)
      
      if (response.pendingApproval) {
        toast.success('Account created successfully! Please wait for admin approval before signing in.')
        router.push('/auth/login')
      } else {
        // Fallback for existing users or if approval is not required
        login(response.user, response.token, response.limits)
        toast.success('Account created successfully!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-orange-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/80 dark:bg-orange-900/20 backdrop-blur-md border-orange-200/50 dark:border-orange-700/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-orange-500/20 backdrop-blur-sm rounded-xl border border-orange-300/30">
                <Camera className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">Screenshot SaaS</span>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900 dark:text-orange-100">Sign Up</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Create a new account to start capturing screenshots
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`bg-white/50 dark:bg-orange-800/20 border-orange-200 dark:border-orange-700/50 text-orange-900 dark:text-orange-100 placeholder:text-orange-500 dark:placeholder:text-orange-400 focus:border-orange-400 focus:ring-orange-200 dark:focus:ring-orange-800/50 ${
                    errors.email ? 'border-red-400 dark:border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 6 characters)"
                    {...register('password')}
                    className={`bg-white/50 dark:bg-orange-800/20 border-orange-200 dark:border-orange-700/50 text-orange-900 dark:text-orange-100 placeholder:text-orange-500 dark:placeholder:text-orange-400 focus:border-orange-400 focus:ring-orange-200 dark:focus:ring-orange-800/50 pr-10 ${
                      errors.password ? 'border-red-400 dark:border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`bg-white/50 dark:bg-orange-800/20 border-orange-200 dark:border-orange-700/50 text-orange-900 dark:text-orange-100 placeholder:text-orange-500 dark:placeholder:text-orange-400 focus:border-orange-400 focus:ring-orange-200 dark:focus:ring-orange-800/50 pr-10 ${
                      errors.confirmPassword ? 'border-red-400 dark:border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 underline underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Free Tier Info */}
            <div className="mt-6 p-4 bg-orange-100/50 dark:bg-orange-800/20 backdrop-blur-sm rounded-lg border border-orange-200/50 dark:border-orange-700/30">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-3">Free Tier Includes:</p>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>100 screenshots per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Up to 10 projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Basic screenshot capture</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Website crawling</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors inline-flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

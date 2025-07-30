'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Globe, Zap, Shield, Code, Users } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-400/15 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-orange-200/30 dark:border-orange-700/30 bg-white/80 dark:bg-orange-900/20 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 backdrop-blur-sm rounded-xl border border-orange-300/30">
              <Camera className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">Screenshot SaaS</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-100/50 dark:hover:bg-orange-800/20" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">
            Capture Screenshots at Scale
          </h1>
          <p className="text-xl text-orange-700 dark:text-orange-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional screenshot capture service with project management, crawling capabilities, 
            and API access. Perfect for developers, designers, and businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl transform hover:scale-105 transition-all duration-200" asChild>
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800/20 hover:border-orange-400 dark:hover:border-orange-600" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Camera className="h-12 w-12 text-primary mb-4" />
              <CardTitle>High-Quality Screenshots</CardTitle>
              <CardDescription>
                Capture pixel-perfect screenshots of any website with our advanced browser automation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Website Crawling</CardTitle>
              <CardDescription>
                Automatically discover and capture screenshots from multiple pages of a website.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Fast & Reliable</CardTitle>
              <CardDescription>
                Lightning-fast screenshot generation with queue-based processing and real-time updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your screenshots are stored securely with role-based access control and authentication.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Developer API</CardTitle>
              <CardDescription>
                Integrate screenshot capture into your applications with our RESTful API.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Organize your work with projects and collaborate with team members.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 border-t">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers and businesses who trust Screenshot SaaS 
            for their website capture needs.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 Screenshot SaaS. Built with Next.js and TypeScript.</p>
        </div>
      </footer>
    </div>
  )
}

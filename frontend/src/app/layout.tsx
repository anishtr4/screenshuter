"use client"

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

const metadata: Metadata = {
  title: 'Screenshot SaaS - Capture & Manage Website Screenshots',
  description: 'Professional screenshot capture service with project management, crawling capabilities, and API access.',
  keywords: ['screenshot', 'website capture', 'saas', 'api', 'web scraping'],
  authors: [{ name: 'Screenshot SaaS Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider store={store}>
          <PersistGate loading={<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">Loading...</div>} persistor={persistor}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  )
}

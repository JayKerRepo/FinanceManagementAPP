import { AuthProvider } from '../src/contexts/AuthContext'
import { BusinessProvider } from '../src/contexts/BusinessContext'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import './globals.css'

export const metadata = {
  title: 'ExpenseIQ - AI-Powered Business Finance Management',
  description: 'Manage multiple businesses with AI voice assistant. Zero chaos, unified business hub.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1729',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f1729] text-white">
        <ErrorBoundary>
          <AuthProvider>
            <BusinessProvider>
              {children}
            </BusinessProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}











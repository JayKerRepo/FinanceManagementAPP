'use client'

import { useAuth } from '../../src/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthPage from '../../src/components/AuthPage'

export default function Auth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/app')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  return <AuthPage />
}











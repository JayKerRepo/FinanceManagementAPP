'use client'

import { useAuth } from '../../src/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthPage from '../../src/components/AuthPage'
import VerifyEmailNotice from '../../src/components/VerifyEmailNotice'
import OnboardingFlow from '../../src/components/OnboardingFlow'
import DashboardMock from '../../src/components/DashboardMock'

export default function App() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const isVerified = Boolean((user as unknown as { email_confirmed_at?: string })?.email_confirmed_at)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
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

  if (!user) {
    return <AuthPage />
  }

  if (!isVerified) {
    return <VerifyEmailNotice />
  }

  if (profile && !profile.onboarding_completed) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />
  }

  return <DashboardMock />
}











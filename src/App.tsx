import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import DemoPage from './components/DemoPage';
import AuthPage from './components/AuthPage';
import OnboardingFlow from './components/OnboardingFlow';
import DashboardMock from './components/DashboardMock';
import VerifyEmailNotice from './components/VerifyEmailNotice';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const isVerified = Boolean((user as unknown as { email_confirmed_at?: string })?.email_confirmed_at);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/app" replace />} />
      <Route
        path="/app"
        element={
          !user ? (
            <AuthPage />
          ) : !isVerified ? (
            <VerifyEmailNotice />
          ) : profile && !profile.onboarding_completed ? (
            <OnboardingFlow onComplete={() => window.location.reload()} />
          ) : (
            <DashboardMock />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BusinessProvider>
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-white text-xl font-semibold">Loading...</div>
                </div>
              </div>
            }
          >
            <AppContent />
          </Suspense>
        </BusinessProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

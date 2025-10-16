import { Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import DemoPage from './components/DemoPage';
import AuthPage from './components/AuthPage';
import OnboardingFlow from './components/OnboardingFlow';
import DashboardMock from './components/DashboardMock';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'demo' | 'app'>('landing');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/demo') {
      setCurrentPage('demo');
    } else if (path === '/app' || user) {
      setCurrentPage('app');
    } else {
      setCurrentPage('landing');
    }
  }, [user]);

  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path === '/demo') {
        setCurrentPage('demo');
      } else if (path === '/app' || user) {
        setCurrentPage('app');
      } else {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [user]);

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

  if (currentPage === 'demo') {
    return <DemoPage />;
  }

  if (currentPage === 'app') {
    if (!user) {
      return <AuthPage />;
    }

    if (profile && !profile.onboarding_completed) {
      return <OnboardingFlow onComplete={() => window.location.reload()} />;
    }

    return <DashboardMock />;
  }

  return <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;

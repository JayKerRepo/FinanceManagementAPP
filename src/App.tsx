import { Suspense, useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DemoPage from './components/DemoPage';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'demo'>('landing');

  useEffect(() => {
    setIsReady(true);
    const path = window.location.pathname;
    if (path === '/demo') {
      setCurrentPage('demo');
    }
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      setCurrentPage(path === '/demo' ? 'demo' : 'landing');
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#1a1d2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1d2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      {currentPage === 'demo' ? <DemoPage /> : <LandingPage />}
    </Suspense>
  );
}

export default App;

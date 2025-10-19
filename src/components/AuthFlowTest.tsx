import { useState } from 'react';
import { CheckCircle, XCircle, Loader, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function AuthFlowTest() {
  const { signUp, signIn, signOut, user, profile, loading } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test form state
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');
  const [testName, setTestName] = useState('Test User');
  const [showPassword, setShowPassword] = useState(false);

  const addTestResult = (test: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => [...prev, { test, status, message, details }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runSignUpTest = async () => {
    addTestResult('Sign Up', 'running', 'Attempting to create new user account...');
    
    try {
      const { error } = await signUp(testEmail, testPassword, testName);
      
      if (error) {
        addTestResult('Sign Up', 'error', 'Sign up failed', error.message);
      } else {
        addTestResult('Sign Up', 'success', 'User account created successfully', 'Check your email for verification link');
      }
    } catch (error) {
      addTestResult('Sign Up', 'error', 'Sign up error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runSignInTest = async () => {
    addTestResult('Sign In', 'running', 'Attempting to sign in...');
    
    try {
      const { error } = await signIn(testEmail, testPassword);
      
      if (error) {
        addTestResult('Sign In', 'error', 'Sign in failed', error.message);
      } else {
        addTestResult('Sign In', 'success', 'Successfully signed in', `User: ${user?.email}`);
      }
    } catch (error) {
      addTestResult('Sign In', 'error', 'Sign in error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runSignOutTest = async () => {
    addTestResult('Sign Out', 'running', 'Attempting to sign out...');
    
    try {
      await signOut();
      addTestResult('Sign Out', 'success', 'Successfully signed out');
    } catch (error) {
      addTestResult('Sign Out', 'error', 'Sign out error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runFullFlowTest = async () => {
    setIsRunning(true);
    clearResults();
    
    // Test 1: Sign Up
    await runSignUpTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Sign In
    await runSignInTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Check User State
    addTestResult('User State', 'running', 'Checking user authentication state...');
    if (user) {
      addTestResult('User State', 'success', 'User is authenticated', `Email: ${user.email}, ID: ${user.id}`);
    } else {
      addTestResult('User State', 'error', 'No authenticated user found');
    }
    
    // Test 4: Check Profile
    addTestResult('Profile Data', 'running', 'Checking user profile data...');
    if (profile) {
      addTestResult('Profile Data', 'success', 'Profile data loaded', `Name: ${profile.full_name}, Onboarding: ${profile.onboarding_completed}`);
    } else {
      addTestResult('Profile Data', 'error', 'No profile data found');
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-400" />;
      case 'running':
        return <Loader className="w-5 h-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-gray-400/30 bg-gray-500/10';
      case 'running':
        return 'border-blue-400/30 bg-blue-500/10';
      case 'success':
        return 'border-green-400/30 bg-green-500/10';
      case 'error':
        return 'border-red-400/30 bg-red-500/10';
    }
  };

  return (
    <div className="bg-[#1a1d2e] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold">Authentication Flow Test</h3>
        <button
          onClick={clearResults}
          className="ml-auto px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg font-semibold transition"
        >
          Clear Results
        </button>
      </div>

      {/* Current Auth State */}
      <div className="mb-6 p-4 bg-[#252a41] rounded-xl">
        <h4 className="font-semibold text-sm mb-2">Current Authentication State</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Loading:</span>
            <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
              {loading ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">User:</span>
            <span className={user ? 'text-green-400' : 'text-red-400'}>
              {user ? user.email : 'Not signed in'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Profile:</span>
            <span className={profile ? 'text-green-400' : 'text-red-400'}>
              {profile ? profile.full_name || 'No name' : 'Not loaded'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            Test Email
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
            placeholder="test@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            Test Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-blue-400 focus:outline-none"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Full Name
          </label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
            placeholder="Test User"
          />
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={runSignUpTest}
          disabled={isRunning}
          className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition disabled:opacity-50"
        >
          Test Sign Up
        </button>
        <button
          onClick={runSignInTest}
          disabled={isRunning}
          className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition disabled:opacity-50"
        >
          Test Sign In
        </button>
        <button
          onClick={runSignOutTest}
          disabled={isRunning}
          className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition disabled:opacity-50"
        >
          Test Sign Out
        </button>
        <button
          onClick={runFullFlowTest}
          disabled={isRunning}
          className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl font-semibold transition disabled:opacity-50"
        >
          Run Full Flow
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Test Results</h4>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h5 className="font-semibold text-sm mb-1">{result.test}</h5>
                  <p className="text-sm text-gray-300 mb-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-400">{result.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



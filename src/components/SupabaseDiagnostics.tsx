import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, Database, Key, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DiagnosticResult {
  test: string;
  status: 'loading' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function SupabaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    results.push({
      test: 'Environment Variables',
      status: 'loading',
      message: 'Checking environment configuration...'
    });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      results[0] = {
        test: 'Environment Variables',
        status: 'error',
        message: 'Missing Supabase environment variables',
        details: `URL: ${supabaseUrl ? 'Present' : 'Missing'}, Key: ${supabaseKey ? 'Present' : 'Missing'}`
      };
    } else if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
      results[0] = {
        test: 'Environment Variables',
        status: 'warning',
        message: 'Using placeholder values - please update with real Supabase credentials',
        details: 'Update your .env file with actual Supabase project URL and anon key'
      };
    } else {
      results[0] = {
        test: 'Environment Variables',
        status: 'success',
        message: 'Environment variables configured',
        details: `URL: ${supabaseUrl.substring(0, 30)}..., Key: ${supabaseKey.substring(0, 20)}...`
      };
    }

    setDiagnostics([...results]);

    // Test 2: Supabase Client Connection
    results.push({
      test: 'Supabase Client',
      status: 'loading',
      message: 'Testing Supabase client initialization...'
    });

    setDiagnostics([...results]);

    try {
      if (!supabase) {
        results[1] = {
          test: 'Supabase Client',
          status: 'error',
          message: 'Supabase client not initialized'
        };
      } else {
        results[1] = {
          test: 'Supabase Client',
          status: 'success',
          message: 'Supabase client initialized successfully'
        };
      }
    } catch (error) {
      results[1] = {
        test: 'Supabase Client',
        status: 'error',
        message: 'Failed to initialize Supabase client',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setDiagnostics([...results]);

    // Test 3: Database Connection
    results.push({
      test: 'Database Connection',
      status: 'loading',
      message: 'Testing database connection...'
    });

    setDiagnostics([...results]);

    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        results[2] = {
          test: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          details: error.message
        };
      } else {
        results[2] = {
          test: 'Database Connection',
          status: 'success',
          message: 'Database connection successful',
          details: 'Can query profiles table'
        };
      }
    } catch (error) {
      results[2] = {
        test: 'Database Connection',
        status: 'error',
        message: 'Database connection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setDiagnostics([...results]);

    // Test 4: Authentication Service
    results.push({
      test: 'Authentication Service',
      status: 'loading',
      message: 'Testing authentication service...'
    });

    setDiagnostics([...results]);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        results[3] = {
          test: 'Authentication Service',
          status: 'error',
          message: 'Authentication service error',
          details: error.message
        };
      } else {
        results[3] = {
          test: 'Authentication Service',
          status: 'success',
          message: 'Authentication service available',
          details: session ? 'Active session found' : 'No active session'
        };
      }
    } catch (error) {
      results[3] = {
        test: 'Authentication Service',
        status: 'error',
        message: 'Authentication service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setDiagnostics([...results]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader className="w-5 h-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-400/30 bg-blue-500/10';
      case 'success':
        return 'border-green-400/30 bg-green-500/10';
      case 'error':
        return 'border-red-400/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-400/30 bg-yellow-500/10';
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-[#1a1d2e] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold">Supabase Connection Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="ml-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{diagnostic.test}</h4>
                <p className="text-sm text-gray-300 mb-1">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="text-xs text-gray-400">{diagnostic.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[#252a41] rounded-xl">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Environment Setup
        </h4>
        <p className="text-xs text-gray-400 mb-2">
          Create a <code className="bg-[#1a1d2e] px-2 py-1 rounded text-blue-400">.env</code> file in your project root:
        </p>
        <pre className="text-xs bg-[#1a1d2e] p-3 rounded-lg text-gray-300 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
        </pre>
        <p className="text-xs text-gray-400 mt-2">
          Get these values from your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a>
        </p>
      </div>
    </div>
  );
}



import { useState } from 'react';
import { Settings, Database, User, AlertCircle, CheckCircle } from 'lucide-react';
import SupabaseDiagnostics from './SupabaseDiagnostics';
import AuthFlowTest from './AuthFlowTest';

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<'supabase' | 'auth'>('supabase');

  return (
    <div className="min-h-screen bg-[#0f1729] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Debug & Diagnostics</h1>
          </div>
          <p className="text-gray-400">
            Test your Supabase connection and authentication flow to ensure everything is working correctly.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1d2e] rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-sm">Supabase</span>
            </div>
            <p className="text-xs text-gray-400">Connection & Database</p>
          </div>
          
          <div className="bg-[#1a1d2e] rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-sm">Authentication</span>
            </div>
            <p className="text-xs text-gray-400">Sign Up, Sign In, Profile</p>
          </div>
          
          <div className="bg-[#1a1d2e] rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-sm">Environment</span>
            </div>
            <p className="text-xs text-gray-400">Configuration & Setup</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'supabase'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-[#252a41] text-gray-400 hover:text-white hover:bg-[#2d3248]'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Supabase Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'auth'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-[#252a41] text-gray-400 hover:text-white hover:bg-[#2d3248]'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Auth Flow Test
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'supabase' && <SupabaseDiagnostics />}
          {activeTab === 'auth' && <AuthFlowTest />}
        </div>

        {/* Quick Setup Guide */}
        <div className="mt-8 bg-[#1a1d2e] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold">Quick Setup Guide</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Create Supabase Project</h4>
                <p className="text-xs text-gray-400">
                  Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com/dashboard</a> and create a new project
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Get API Credentials</h4>
                <p className="text-xs text-gray-400">
                  In your Supabase dashboard, go to Settings → API and copy your Project URL and anon public key
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Create .env File</h4>
                <p className="text-xs text-gray-400">
                  Create a <code className="bg-[#252a41] px-2 py-1 rounded text-blue-400">.env</code> file in your project root with your credentials
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">4</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Run Database Migrations</h4>
                <p className="text-xs text-gray-400">
                  In Supabase SQL Editor, run the migration files from <code className="bg-[#252a41] px-2 py-1 rounded text-blue-400">supabase/migrations/</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">5</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Test Connection</h4>
                <p className="text-xs text-gray-400">
                  Use the diagnostics above to verify your connection and test the authentication flow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



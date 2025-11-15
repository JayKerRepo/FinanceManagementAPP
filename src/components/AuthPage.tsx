import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, resendVerification } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        // basic client validation
        if (!formData.fullName.trim()) throw new Error('Full name is required');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) throw new Error('Enter a valid email');
        if ((formData.password || '').length < 8) throw new Error('Password must be at least 8 characters');

        const { error } = await signUp(formData.email.trim(), formData.password, formData.fullName.trim());
        if (error) throw error;
        
        // Store signup data in localStorage for onboarding pre-population
        localStorage.setItem('signupData', JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData?.phone || '',
        }));
        
        setInfo('Account created. Please check your email to verify your address before signing in.');
      }
  } catch (err: any) {
      const msg = err?.message || 'An error occurred';
      if (/already\s*registered/i.test(msg) || /user\s*exists/i.test(msg)) {
        setInfo('An account with this email already exists. Please sign in, or reset your password if you forgot it.');
        setError('');
      } else if (/email\s*not\s*confirmed/i.test(msg) || /not\s*confirmed/i.test(msg)) {
        setInfo('Email not confirmed. Please check your inbox and verify your email before signing in.');
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">ExpenseIQ</span>
          </h1>
          <p className="text-gray-400">Smart Expense Management</p>
        </div>

        <div className="card-dark p-8">
          <div className="flex gap-2 mb-6 bg-[#0f1729] p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          {info && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300">
              {info}
            </div>
          )}

          {mode === 'signin' && /not\s*confirmed/i.test(info) && (
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={async () => {
                  const email = (formData.email || '').trim();
                  if (!email) { setError('Enter your email above to resend verification'); return; }
                  const { error } = await (resendVerification?.(email) || Promise.resolve({ error: null }));
                  if (error) setError(error.message || 'Failed to resend verification');
                  else { setInfo('Verification email sent. Check your inbox.'); setError(''); }
                }}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition"
              >
                Resend verification email
              </button>
            </div>
          )}

          {mode === 'signup' && info && (
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="px-3 py-2 bg-[#1a1d2e] border border-white/10 rounded-lg text-sm hover:bg-[#252a41] transition"
              >
                Go to Sign In
              </button>
              <button
                type="button"
                onClick={async () => {
                  const email = (formData.email || '').trim();
                  if (!email) { setError('Enter your email above to reset password'); return; }
                  const { error } = await (resetPassword?.(email) || Promise.resolve({ error: null }));
                  if (error) setError(error.message || 'Failed to send reset email');
                  else { setInfo('Password reset email sent. Check your inbox.'); setError(''); }
                }}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition"
              >
                Reset Password
              </button>
            </div>
          )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>

            {mode === 'signin' && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

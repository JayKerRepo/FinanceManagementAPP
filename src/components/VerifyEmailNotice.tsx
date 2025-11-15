'use client'

import { Mail, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailNotice() {
  const { user, profile, resendVerification } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (status === 'sending') return;
    const email = (profile?.email || user?.email || '').trim();
    if (!email) {
      setStatus('error');
      setMessage('No email found on your account.');
      return;
    }
    try {
      setStatus('sending');
      setMessage('');
      const { error } = await (resendVerification?.(email) || Promise.resolve({ error: null as unknown as Error | null }));
      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to resend verification email');
        return;
      }
      setStatus('sent');
      setMessage('Verification email sent again. Please check your inbox.');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
      <div className="text-center text-white max-w-md">
        <Mail className="w-12 h-12 mx-auto mb-4 text-blue-400" />
        <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>
        <p className="text-gray-300">
          We’ve sent a verification link to your email. Please verify your address, then return to the app.
          If you don’t see it, check your spam folder.
        </p>
        <div className="mt-6">
          <button
            onClick={handleResend}
            disabled={status === 'sending'}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" />
            {status === 'sending' ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
        {message && (
          <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : 'text-blue-300'}`}>{message}</p>
        )}
      </div>
    </div>
  );
}




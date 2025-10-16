import { useState } from 'react';
import { User, Building2, CheckCircle2, ArrowRight, ArrowLeft, Mic, Receipt, TrendingUp, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: '',
  });

  const [businessData, setBusinessData] = useState({
    name: '',
    business_type: 'Retail & Restaurants',
    tax_id: '',
    address: '',
    account_number: '',
  });

  const businessTypes = [
    'Retail & Restaurants',
    'Technology',
    'Professional Services',
    'Healthcare',
    'Real Estate',
    'Manufacturing',
    'Construction',
    'Education',
    'Non-Profit',
    'Other',
  ];

  const handleProfileSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
      });

      if (error) throw error;
      setStep(3);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('No user found');

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: businessData.name,
          business_type: businessData.business_type,
          tax_id: businessData.tax_id || null,
          address: businessData.address ? { street: businessData.address } : {},
          is_default: true,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      const accountNumber = businessData.account_number || `B${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          business_id: business.id,
          name: 'Business Checking',
          account_type: 'checking',
          bank_name: 'Default Bank',
          currency: 'USD',
          account_number: accountNumber,
        });

      if (accountError) throw accountError;

      setStep(4);
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    await updateProfile({ onboarding_completed: true });
    setStep(5);
    setTimeout(() => {
      onComplete();
    }, 2000);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {step === 1 && (
          <div className="card-dark p-10 animate-fade-in text-center">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2">Welcome to Expense IQ</h1>
              <p className="text-gray-400">Let's get your business finances set up in just a few minutes.</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>

            <div className="text-sm font-semibold text-gray-400 mb-8">Step 1 of 5</div>

            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Briefcase className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-bold mb-4">Welcome to Expense IQ</h2>
            <p className="text-gray-400 mb-10 max-w-lg mx-auto">
              Your AI-powered expense tracking companion for solopreneurs and multi-business owners.
            </p>

            <div className="space-y-6 mb-10 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-bold mb-1">Voice-First Interface</h3>
                  <p className="text-sm text-gray-400">Simply speak your expenses and let AI handle the rest</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-bold mb-1">Multi-Business Support</h3>
                  <p className="text-sm text-gray-400">Track expenses across all your ventures in one place</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-bold mb-1">Smart Categorization</h3>
                  <p className="text-sm text-gray-400">AI automatically categorizes and tags your expenses</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card-dark p-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${i === 2 ? 'bg-red-500' : i < 2 ? 'bg-green-500' : 'bg-gray-600'}`}
                  />
                ))}
              </div>
              <div className="text-sm font-semibold text-gray-400 mb-6">Step 2 of 5</div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Create Your Profile</h2>
              <p className="text-gray-400">Tell us a bit about yourself</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleProfileSubmit}
                disabled={!profileData.full_name || loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-dark p-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${i === 3 ? 'bg-red-500' : i < 3 ? 'bg-green-500' : 'bg-gray-600'}`}
                  />
                ))}
              </div>
              <div className="text-sm font-semibold text-gray-400 mb-6">Step 3 of 5</div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Set Up Your Business</h2>
              <p className="text-gray-400">Tell us about your business</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessData.name}
                  onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                  placeholder="Chase Fargo Pass"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Business Type *
                </label>
                <select
                  value={businessData.business_type}
                  onChange={(e) => setBusinessData({ ...businessData, business_type: e.target.value })}
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none"
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Account Number (Optional)
                </label>
                <input
                  type="text"
                  value={businessData.account_number}
                  onChange={(e) => setBusinessData({ ...businessData, account_number: e.target.value })}
                  placeholder="B020:08"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Tax ID / EIN (Optional)
                </label>
                <input
                  type="text"
                  value={businessData.tax_id}
                  onChange={(e) => setBusinessData({ ...businessData, tax_id: e.target.value })}
                  placeholder="12-3456789"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Business Address (Optional)
                </label>
                <input
                  type="text"
                  value={businessData.address}
                  onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleBusinessSubmit}
                disabled={!businessData.name || loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card-dark p-8 animate-fade-in text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i === 4 ? 'bg-red-500' : i < 4 ? 'bg-green-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
            <div className="text-sm font-semibold text-gray-400 mb-8">Step 4 of 5</div>

            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-bold mb-4">You're Almost Done!</h2>
            <p className="text-gray-400 mb-10">
              Your business profile is set up. Let's finalize your account.
            </p>

            <div className="bg-[#1a2332] rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4 text-center">Quick Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mic className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">Use voice commands to quickly add expenses on the go</p>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">Scan receipts for automatic data extraction</p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">View real-time analytics and insights for your business</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Finalizing...' : 'Complete Setup'}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="card-dark p-8 animate-fade-in text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-green-500" />
              ))}
            </div>
            <div className="text-sm font-semibold text-gray-400 mb-8">Step 5 of 5</div>

            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-3">All Set!</h2>
            <p className="text-gray-400 text-lg mb-6">
              Your account is ready. Let's start managing your finances!
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

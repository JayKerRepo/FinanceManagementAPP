import { useState } from 'react';
import { User, Building2, Briefcase, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
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
      setStep(2);
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

      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          business_id: business.id,
          name: 'Business Checking',
          account_type: 'checking',
          bank_name: 'Default Bank',
          currency: 'USD',
        });

      if (accountError) throw accountError;

      await updateProfile({ onboarding_completed: true });
      setStep(3);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {step === 1 && (
          <div className="card-dark p-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome to ExpenseIQ</h2>
              <p className="text-gray-400">Let's set up your profile</p>
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

            <button
              onClick={handleProfileSubmit}
              disabled={!profileData.full_name || loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card-dark p-8 animate-fade-in">
            <div className="text-center mb-8">
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
                  placeholder="Acme Corp"
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
                onClick={() => setStep(1)}
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
                {loading ? 'Creating...' : 'Complete Setup'}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-dark p-8 animate-fade-in text-center">
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

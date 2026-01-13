import { useState } from 'react';
import {
  User,
  Shield,
  Moon,
  Mic,
  Bell,
  Database,
  HelpCircle,
  Mail,
  FileText,
  ChevronRight,
  LogOut,
  Trash2,
  Home,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Lock,
  MessageCircle,
  Star,
} from 'lucide-react';
import SubscriptionManager from './SubscriptionManager';
import PaymentMethodsManager from './PaymentMethodsManager';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';
import { UserPreferences } from '../lib/database.types';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function SettingsPage({ onNavigate, currentPage = 'settings' }: Props = {}) {
  const { profile, updatePreferences, updateProfile } = useAuth();
  const { currentBusiness } = useBusiness();
  const [darkMode, setDarkMode] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    company_name: currentBusiness?.name || ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'USD',
    language: 'en',
    timezone: 'UTC',
    defaultView: 'dashboard',
    defaultBusinessId: 'recent',
    autoOpenExpenseEntry: false,
    ...profile?.preferences
  });

  const handlePreferenceChange = async (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    const { error } = await updatePreferences({ [key]: value });
    if (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone
      });

      if (error) throw error;

      // Optionally persist company name to businesses table if changed and business selected
      if (currentBusiness?.id && profileForm.company_name && profileForm.company_name !== currentBusiness.name) {
        const { error: updateError } = await (supabase as any)
          .from('businesses')
          .update({ name: profileForm.company_name })
          .eq('id', currentBusiness.id);
        
        if (updateError) {
          console.error('Error updating business name:', updateError);
        }
      }

      alert('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Grid */}
      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Profile Section - Left Column */}
          <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Profile Information</h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {isEditingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 opacity-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-1">{profile?.full_name || 'User'}</h2>
                <p className="text-sm text-gray-400 mb-2">{profile?.email}</p>
                <p className="text-sm text-gray-400">{profile?.phone || 'No phone number'}</p>
              </div>
            )}
          </div>
          
          {/* Preferences Section - Right Column */}
          <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Default View</label>
                <select
                  value={preferences.defaultView}
                  onChange={(e) => handlePreferenceChange('defaultView', e.target.value)}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="expense-entry">Expense Entry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Default Business</label>
                <select
                  value={preferences.defaultBusinessId}
                  onChange={(e) => handlePreferenceChange('defaultBusinessId', e.target.value)}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3"
                >
                  <option value="recent">Most Recent</option>
                  <option value="first">First Business</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Auto-open Expense Entry</span>
                <button
                  onClick={() => handlePreferenceChange('autoOpenExpenseEntry', !preferences.autoOpenExpenseEntry)}
                  className={`w-12 h-6 rounded-full transition ${
                    preferences.autoOpenExpenseEntry ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition ${
                    preferences.autoOpenExpenseEntry ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* App Settings - Left Column */}
          <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">App Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition ${
                    darkMode ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition ${
                    darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Voice Commands</span>
                <button
                  onClick={() => setVoiceCommands(!voiceCommands)}
                  className={`w-12 h-6 rounded-full transition ${
                    voiceCommands ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition ${
                    voiceCommands ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Push Notifications</span>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-12 h-6 rounded-full transition ${
                    pushNotifications ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Auto Backup</span>
                <button
                  onClick={() => setAutoBackup(!autoBackup)}
                  className={`w-12 h-6 rounded-full transition ${
                    autoBackup ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition ${
                    autoBackup ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Security - Right Column */}
          <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Security</h3>
            <div className="space-y-3">
              <button className="w-full bg-[#252a41] rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm mb-0.5">Change Password</p>
                  <p className="text-xs text-gray-400">Update your password</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
              </button>
              <button className="w-full bg-[#252a41] rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm mb-0.5">Two-Factor Auth</p>
                  <p className="text-xs text-gray-400">Enable 2FA for extra security</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
          
          {/* Subscription - Left Column */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Current Plan</p>
                <h3 className="text-2xl font-bold">Professional</h3>
                <p className="text-xs opacity-75 mt-1">Billed monthly</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$29</p>
                <p className="text-xs opacity-75">/month</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 mb-4">
              <p className="text-xs opacity-90 mb-2">Next billing date</p>
              <p className="font-semibold">February 20, 2025</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSubscriptionManager(true)}
                className="flex-1 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-white/90 transition text-sm"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => setShowSubscriptionManager(true)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
              >
                Manage
              </button>
            </div>
          </div>
          
          {/* Payment Methods - Right Column */}
          <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
            <button
              onClick={() => setShowPaymentMethods(true)}
              className="w-full bg-[#252a41] rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm mb-0.5">Payment Methods</p>
                <p className="text-xs text-gray-400">Manage billing and payment</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
          
          {/* Danger Zone - Full Width */}
          <div className="lg:col-span-2 bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
            <h3 className="text-lg font-bold mb-4 text-red-400">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm mb-1">Delete Account</p>
                <p className="text-xs text-gray-400">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e2337] rounded-3xl p-6 max-w-sm w-full border border-red-500/30">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-[#252a45] rounded-xl font-semibold hover:bg-[#2d3352] transition"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-red-500 rounded-xl font-semibold hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSubscriptionManager && (
        <SubscriptionManager
          currentPlan="pro"
          onClose={() => setShowSubscriptionManager(false)}
        />
      )}

      {showPaymentMethods && (
        <PaymentMethodsManager onClose={() => setShowPaymentMethods(false)} />
      )}

      {/* Bottom Navigation - only show if onNavigate is provided */}
      {onNavigate && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1d35]/95 backdrop-blur-2xl border-t border-white/10">
          <div className="flex items-center justify-around px-4 py-4 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'home' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => onNavigate('accounts')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'accounts' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-medium">Accounts</span>
            </button>

            <button className="relative -mt-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 transition">
                <Plus className="w-8 h-8" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('budgets')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'budgets' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs font-medium">Budgets</span>
            </button>

            <button className="flex flex-col items-center gap-1.5 text-blue-400 transition">
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

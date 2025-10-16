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
} from 'lucide-react';
import SubscriptionManager from './SubscriptionManager';
import PaymentMethodsManager from './PaymentMethodsManager';

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function SettingsPage({ onNavigate, currentPage = 'settings' }: Props = {}) {
  const [darkMode, setDarkMode] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 mb-8">
        <div className="bg-[#1e2337] rounded-3xl p-6 border border-white/5 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
              S
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1">Sarah Johnson</h2>
          <p className="text-sm text-gray-400 mb-4">sarah@businessemail.com</p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-semibold hover:scale-105 transition text-sm">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">SUBSCRIPTION</h3>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-3">
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
        <div className="space-y-2">
          <button
            onClick={() => setShowPaymentMethods(true)}
            className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group"
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
      </div>

      {/* Account Section */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ACCOUNT</h3>
        <div className="space-y-2">
          <button className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm mb-0.5">Personal Information</p>
              <p className="text-xs text-gray-400">Update your profile details</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </button>

          <button className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm mb-0.5">Security & Privacy</p>
              <p className="text-xs text-gray-400">Password, 2FA, and privacy options</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>

      {/* App Settings Section */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">APP SETTINGS</h3>
        <div className="bg-[#1e2337] rounded-2xl border border-white/5 divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Dark Mode</p>
                <p className="text-xs text-gray-400">Toggle dark/light theme</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-7 rounded-full transition relative ${
                darkMode ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  darkMode ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Voice Commands</p>
                <p className="text-xs text-gray-400">Enable voice expense entry</p>
              </div>
            </div>
            <button
              onClick={() => setVoiceCommands(!voiceCommands)}
              className={`w-12 h-7 rounded-full transition relative ${
                voiceCommands ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  voiceCommands ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Push Notifications</p>
                <p className="text-xs text-gray-400">Budget alerts and reminders</p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-12 h-7 rounded-full transition relative ${
                pushNotifications ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  pushNotifications ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">Auto-Backup</p>
                <p className="text-xs text-gray-400">Automatically backup your data</p>
              </div>
            </div>
            <button
              onClick={() => setAutoBackup(!autoBackup)}
              className={`w-12 h-7 rounded-full transition relative ${
                autoBackup ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  autoBackup ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">SUPPORT</h3>
        <div className="space-y-2">
          <button className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm mb-0.5">Help Center</p>
              <p className="text-xs text-gray-400">FAQs and tutorials</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </button>

          <button className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-pink-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm mb-0.5">Contact Support</p>
              <p className="text-xs text-gray-400">Get help from our team</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </button>

          <button className="w-full bg-[#1e2337] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm mb-0.5">Privacy Policy</p>
              <p className="text-xs text-gray-400">How we protect your data</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">DANGER ZONE</h3>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-red-500/10 rounded-2xl p-4 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm mb-0.5 text-red-400">Delete Account</p>
            <p className="text-xs text-red-300/60">Permanently delete your account and data</p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition" />
        </button>
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

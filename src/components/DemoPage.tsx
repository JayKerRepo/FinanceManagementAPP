import { useState } from 'react';
import {
  Home,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Mic,
  Camera,
  Download,
  ArrowLeft,
  Monitor,
  Smartphone,
  MessageSquare,
  ChevronDown,
  CreditCard,
} from 'lucide-react';
import AccountsPage from './AccountsPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import BudgetsPage from './BudgetsPage';
import AddTransactionModal from './AddTransactionModal';

export default function DemoPage() {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [currentPage, setCurrentPage] = useState<'home' | 'accounts' | 'reports' | 'settings' | 'budgets'>('home');
  const [isListening, setIsListening] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState('Chase Fargo Pass B020:08');
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const businesses = [
    { name: 'Chase Fargo Pass B020:08', type: 'Retail & Restaurants' },
    { name: 'Tech Startup LLC', type: 'Technology' },
    { name: 'Consulting Services Inc', type: 'Professional Services' },
  ];

  const DashboardContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">Good morning, Sarah</h1>
            <p className="text-sm text-blue-300/70">Here's your business overview</p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400/30">
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
              S
            </div>
          </div>
        </div>

        {/* Business Selector */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#252a45]/50 rounded-2xl border border-white/5 hover:border-blue-500/30 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                CF
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{selectedBusiness}</p>
                <p className="text-xs text-gray-400">Retail & Restaurants</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showBusinessDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#252a45] rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl">
              {businesses.map((business) => (
                <button
                  key={business.name}
                  onClick={() => {
                    setSelectedBusiness(business.name);
                    setShowBusinessDropdown(false);
                  }}
                  className="w-full p-4 hover:bg-[#2d3352] transition text-left border-b border-white/5 last:border-0"
                >
                  <p className="text-sm font-semibold">{business.name}</p>
                  <p className="text-xs text-gray-400">{business.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-3xl mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5b6ef6] via-[#6b7bff] to-[#8b5cf6]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <Eye className="w-5 h-5 opacity-75" />
            </div>
            <div className="mb-2">
              <div className="text-5xl font-bold tracking-tight mb-1">$24,448.74</div>
              <div className="text-sm text-blue-100/80">+7.25% from last month</div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Income & Expenses */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1e2337] rounded-2xl p-5 border border-white/5">
            <p className="text-sm text-gray-400 mb-2">Income</p>
            <p className="text-3xl font-bold mb-1">$8,247.50</p>
            <p className="text-xs text-green-400 font-medium">+8.2%</p>
          </div>
          <div className="bg-[#1e2337] rounded-2xl p-5 border border-white/5">
            <p className="text-sm text-gray-400 mb-2">Expenses</p>
            <p className="text-3xl font-bold mb-1">$4,127.30</p>
            <p className="text-xs text-red-400 font-medium">-3.1%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsListening(!isListening)}
              className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition flex flex-col items-center gap-3 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition ${isListening ? 'opacity-100' : ''}`}></div>
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative ${isListening ? 'animate-pulse' : ''}`}>
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
                )}
                <Mic className="w-7 h-7 relative z-10" />
              </div>
              <span className="text-sm font-semibold relative z-10">Voice Entry</span>
            </button>

            <button className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition flex flex-col items-center gap-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center relative">
                <Camera className="w-7 h-7 relative z-10" />
              </div>
              <span className="text-sm font-semibold relative z-10">Scan Receipt</span>
            </button>

            <button className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition flex flex-col items-center gap-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center relative">
                <Download className="w-7 h-7 relative z-10" />
              </div>
              <span className="text-sm font-semibold relative z-10">Import</span>
            </button>

            <button className="bg-[#1e2337] rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition flex flex-col items-center gap-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center relative">
                <BarChart3 className="w-7 h-7 relative z-10" />
              </div>
              <span className="text-sm font-semibold relative z-10">Analytics</span>
            </button>
          </div>
        </div>

        {/* Voice Listening Indicator */}
        {isListening && (
          <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-blue-500/30 animate-pulse-subtle">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-100 mb-1">Listening...</p>
                <p className="text-xs text-gray-300">"Add $50 expense for coffee at Starbucks..."</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );

  const BottomNav = ({ currentPage, onNavigate }: { currentPage: string; onNavigate: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1d35]/95 backdrop-blur-2xl border-t border-white/10">
      <div className="flex items-center justify-around px-4 py-4 max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1.5 transition ${
            currentPage === 'home' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => onNavigate('accounts')}
          className={`flex flex-col items-center gap-1.5 transition ${
            currentPage === 'accounts' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Accounts</span>
        </button>

        <button onClick={() => setShowAddTransaction(true)} className="relative -mt-6">
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
          <div className="w-6 h-6 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Budgets</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1.5 transition ${
            currentPage === 'settings' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d1a] via-[#0f1221] to-[#1a1d35] text-white">
      {/* Demo Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1d2e]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span className="font-medium">Back to Landing</span>
          </a>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">View Mode:</span>
            <div className="flex gap-2 bg-[#252a41] p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium ${
                  viewMode === 'mobile'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">Mobile</span>
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium ${
                  viewMode === 'desktop'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm">Desktop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="pt-24 pb-20">
        {viewMode === 'mobile' ? (
          <div className="flex justify-center items-start px-6">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-full blur-3xl opacity-75 animate-pulse-slow"></div>

              {/* Phone Frame */}
              <div className="relative" style={{ width: '390px' }}>
                <div className="bg-[#1a1d35] rounded-[3.5rem] overflow-hidden border-[12px] border-[#2a2d45] shadow-2xl">
                  {/* Notch */}
                  <div className="bg-[#0f1221] h-8 flex items-center justify-center relative">
                    <div className="w-36 h-6 bg-[#1a1d35] rounded-full"></div>
                  </div>

                  {/* Screen Content */}
                  <div style={{ height: '740px', overflowY: 'auto' }} className="scrollbar-hide">
                    {currentPage === 'home' && <DashboardContent />}
                    {currentPage === 'accounts' && <AccountsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
                    {currentPage === 'budgets' && <BudgetsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
                    {currentPage === 'reports' && <ReportsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
                    {currentPage === 'settings' && <SettingsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-[#1a1d35] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {currentPage === 'home' && <DashboardContent />}
              {currentPage === 'accounts' && <AccountsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
              {currentPage === 'budgets' && <BudgetsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
              {currentPage === 'reports' && <ReportsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
              {currentPage === 'settings' && <SettingsPage onNavigate={setCurrentPage} currentPage={currentPage} />}
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal isOpen={showAddTransaction} onClose={() => setShowAddTransaction(false)} />

      {/* Key Features Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Key Features Demonstrated
          </h2>
          <p className="text-gray-400 text-lg">Experience the power of AI-driven expense management</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Mic className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Voice-First Interface</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Natural language processing allows users to speak expenses without rigid command structures.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-purple-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Categorization</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered expense categorization learns from user patterns and industry standards.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Business Management</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Seamlessly switch between different business entities with unified reporting.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-orange-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Receipt Scanning</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Snap photos of receipts and let AI extract all data automatically with high accuracy.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-pink-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-Time Insights</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Advanced analytics provide actionable insights about spending patterns and budget performance.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1e2337] to-[#252a45] p-8 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Responsive Design</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Seamless experience across all devices with mobile-first design approach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client'

import {
  Mic,
  Camera,
  TrendingUp,
  TrendingDown,
  Home,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  User,
  Plus,
  Eye,
  Upload,
  MessageSquare,
  Menu,
  ChevronRight,
  Building2,
  Receipt,
  CreditCard,
  PieChart,
  Volume2,
  Image as ImageIcon,
  Paperclip,
  Send,
  X,
  Check,
  LogOut,
  Inbox,
  MapPin,
  Bell,
  Wallet,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useBusiness } from '../contexts/BusinessContext';
import BusinessSwitcher from './BusinessSwitcher';
import AccountsPage from './AccountsPage';
import BudgetsPage from './BudgetsPage';
import ReportsTabs from './reports/ReportsTabs';
import ExpenseEntryHub from './ExpenseEntryHub';
import SettingsPage from './SettingsPage';
import BusinessManagementPage from './BusinessManagementPage';
import InvoicesPage from './InvoicesPage';
import InvoiceManagement from './InvoiceManagement';
import ProfitLossPage from './ProfitLossPage';
import MileagePage from './MileagePage';
import InboxPage from './InboxPage';
import CategoryManagement from './CategoryManagement';
import LiveKPICards from './dashboard/LiveKPICards';
import CompactCharts from './dashboard/CompactCharts';
import SmartTimeSlider, { TimeRange } from './dashboard/SmartTimeSlider';
import CrossBusinessFilter from './dashboard/CrossBusinessFilter';
import HeatmapCalendar from './dashboard/HeatmapCalendar';
import LivePLBadge from './dashboard/LivePLBadge';
import AIInsightCard from './dashboard/AIInsightCard';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

export default function DashboardMock() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { currentBusiness, accounts, businesses } = useBusiness();
  const [activePage, setActivePage] = useState('dashboard');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [expenseEntryMode, setExpenseEntryMode] = useState<'voice' | 'chat' | 'ocr' | 'manual'>('voice');
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days',
    type: 'month'
  });
  const [revenue, setRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [revenueTrendData, setRevenueTrendData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);

  // Initialize based on user preferences
  useEffect(() => {
    if (profile?.preferences) {
      const preferences = profile.preferences as any;
      
      // Set default view based on preferences
      if (preferences.defaultView && preferences.defaultView !== 'dashboard') {
        setActivePage(preferences.defaultView);
      }
      
      // Auto-open expense entry if preference is enabled
      if (preferences.autoOpenExpenseEntry) {
        setShowVoiceModal(true);
      }
    }
  }, [profile]);

  // Fetch Revenue and Net Worth data
  useEffect(() => {
    const fetchFinancialOverview = async () => {
      if (!businesses || businesses.length === 0) return;

      try {
        const businessIds = businesses.map(b => b.id);
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const lastYearStart = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        const lastYearEnd = new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0];

        // Fetch Revenue (YTD Income from all businesses)
        const { data: allBusinessIncome } = await supabase
          .from('transactions')
          .select('amount, date')
          .eq('transaction_type', 'income')
          .in('business_id', businessIds)
          .gte('date', yearStart);

        // Fetch last year income for comparison
        const { data: lastYearIncome } = await supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'income')
          .in('business_id', businessIds)
          .gte('date', lastYearStart)
          .lte('date', lastYearEnd);

        const currentRevenue = allBusinessIncome?.reduce((sum, t: { amount?: number }) => sum + (t.amount || 0), 0) || 0;
        const lastYearRevenue = lastYearIncome?.reduce((sum, t: { amount?: number }) => sum + (t.amount || 0), 0) || 0;
        const change = lastYearRevenue > 0 ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

        setRevenue(currentRevenue);
        setRevenueChange(change);

        // Generate revenue trend data (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(monthDate.getMonth() - i);
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];
          
          const { data: monthIncome } = await supabase
            .from('transactions')
            .select('amount')
            .eq('transaction_type', 'income')
            .in('business_id', businessIds)
            .gte('date', monthStart)
            .lte('date', monthEnd);

          const monthRevenue = monthIncome?.reduce((sum, t: { amount?: number }) => sum + (t.amount || 0), 0) || 0;
          months.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthRevenue
          });
        }
        setRevenueTrendData(months);

        // Fetch Net Worth (Assets - Liabilities)
        // Assets: All account balances
        const { data: allAccounts } = await supabase
          .from('accounts')
          .select('balance, account_type')
          .in('business_id', businessIds)
          .eq('is_active', true);

        const assets = allAccounts?.reduce((sum, acc: { balance?: number }) => sum + (acc.balance || 0), 0) || 0;

        // Liabilities: Outstanding invoices + credit card debts
        const { data: allInvoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .in('business_id', businessIds)
          .in('status', ['sent', 'partial', 'overdue']);

        const outstandingInvoices = allInvoices?.reduce(
          (sum, inv: { total_amount?: number; paid_amount?: number }) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)),
          0
        ) || 0;

        // Credit card debts (negative balances)
        const creditCardDebts = allAccounts
          ?.filter((acc: { account_type?: string; balance?: number }) => acc.account_type === 'credit_card' && (acc.balance ?? 0) < 0)
          .reduce((sum, acc: { balance?: number }) => sum + Math.abs(acc.balance || 0), 0) || 0;

        const liabilities = outstandingInvoices + creditCardDebts;
        const netWorthValue = assets - liabilities;

        setTotalAssets(assets);
        setTotalLiabilities(liabilities);
        setNetWorth(netWorthValue);
      } catch (error) {
        console.error('Error fetching financial overview:', error);
      }
    };

    if (activePage === 'dashboard') {
      fetchFinancialOverview();
    }
  }, [businesses, activePage]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleBusinessToggle = (businessId: string, enabled: boolean) => {
    if (enabled) {
      setSelectedBusinesses(prev => [...prev, businessId]);
    } else {
      setSelectedBusinesses(prev => prev.filter(id => id !== businessId));
    }
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
  };

  const getBusinessDisplay = () => {
    if (!currentBusiness) return 'No Business Selected';
    const account = accounts[0];
    const accountNumber = account?.account_number || 'N/A';
    return `${currentBusiness.name} ${accountNumber}`;
  };

  const monthBreakdown = [
    { category: 'Office & Admin', amount: 1547, color: '#5b6ef6', percentage: 37 },
    { category: 'Marketing', amount: 1230, color: '#10b981', percentage: 30 },
    { category: 'Travel & Meals', amount: 890, color: '#f59e0b', percentage: 22 },
    { category: 'Other', amount: 460, color: '#6b7280', percentage: 11 },
  ];

  const totalSpent = monthBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const recentTransactions = [
    {
      id: 1,
      title: 'Rent Payment',
      description: 'Property Management - Business A',
      amount: -1200,
      date: '2 days ago',
      category: 'Office & Admin',
      icon: '🏠'
    },
    {
      id: 2,
      title: 'Client Invoice',
      description: 'Project Payment Received',
      amount: 5000,
      date: '3 days ago',
      category: 'Income',
      icon: '💰'
    },
    {
      id: 3,
      title: 'Marketing Campaign',
      description: 'Facebook Ads - Q1',
      amount: -450,
      date: '4 days ago',
      category: 'Marketing',
      icon: '📱'
    },
  ];

  const recentExpenses = [
    {
      id: 1,
      vendor: 'Office Depot',
      amount: 245.50,
      category: 'Office & Admin',
      date: '2025-01-20',
      paymentMethod: 'Corporate Card ****4532',
      status: 'pending',
      hasReceipt: true,
    },
    {
      id: 2,
      vendor: 'Starbucks',
      amount: 32.75,
      category: 'Travel & Meals',
      date: '2025-01-19',
      paymentMethod: 'Cash',
      status: 'approved',
      hasReceipt: true,
    },
    {
      id: 3,
      vendor: 'Amazon Web Services',
      amount: 189.00,
      category: 'Software',
      date: '2025-01-18',
      paymentMethod: 'ACH Transfer',
      status: 'approved',
      hasReceipt: false,
    },
  ];

  const handleFileAttach = () => {
    setAttachedFiles([...attachedFiles, 'receipt.pdf']);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#0f1221] text-white flex">
      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-[#1a1d2e] border-r border-white/5 transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center gap-3 w-full"
            >
              <Menu className="w-6 h-6 text-gray-400" />
              {!sidebarCollapsed && (
                <span className="text-sm text-gray-400">{profile?.full_name || 'User'}'s businesses</span>
              )}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'dashboard' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Dashboard</span>}
            </button>

            <button
              onClick={() => setActivePage('expenses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'expenses' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <Receipt className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Expenses</span>}
            </button>

            {/* Nested under Expenses: Manage Categories */}
            <button
              onClick={() => setActivePage('categories')}
              className={`w-full flex items-center gap-3 px-10 py-2 rounded-lg transition ${
                activePage === 'categories' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <PieChart className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-sm">Manage Categories</span>}
            </button>

            <button
              onClick={() => setActivePage('inbox')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition relative ${
                activePage === 'inbox' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <Inbox className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Inbox</span>}
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePage('invoices')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'invoices' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <FileText className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Invoices</span>}
            </button>

            <button
              onClick={() => setActivePage('budgets')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'budgets' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <Wallet className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Budgets</span>}
            </button>

            <button
              onClick={() => setActivePage('mileage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'mileage' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <MapPin className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Mileage</span>}
            </button>

            <button
              onClick={() => setActivePage('pnl')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'pnl' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">P&L</span>}
            </button>

            <button
              onClick={() => setActivePage('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'reports' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Reports</span>}
            </button>

            {/* Business Management moved to profile dropdown */}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#252a41] rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} pb-20`}>
        <header className="bg-[#1a1d2e]/50 backdrop-blur-xl border-b border-white/5 p-6 relative z-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Welcome, {profile?.full_name || 'User'}!</h1>
              <p className="text-sm text-gray-400">
                {currentBusiness ? `${getBusinessDisplay()} - ${currentBusiness.business_type}` : 'No business selected'}
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[10000]">
              <BusinessSwitcher />
              {activePage !== 'dashboard' && (
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              )}
              <button
                onClick={() => setActivePage('inbox')}
                className="relative w-10 h-10 bg-[#2d3248] hover:bg-[#373d5f] rounded-full flex items-center justify-center transition"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:opacity-90 transition"
                >
                  {profile?.full_name?.substring(0, 1).toUpperCase() || 'U'}
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-[#1a2332] rounded-xl border border-white/10 shadow-2xl py-2 min-w-[220px] z-50">
                    <button
                      onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-[#252a41] transition flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => { setActivePage('businesses'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-[#252a41] transition flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Business Management
                    </button>
                    <button
                      onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-[#252a41] transition flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Manage Subscription
                    </button>
                    <div className="border-t border-white/10 my-2"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-[#252a41] transition flex items-center gap-2 text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {activePage === 'expenses' && <AccountsPage />}
        {activePage === 'categories' && <CategoryManagement />}
        {activePage === 'reports' && <ReportsTabs businessId={currentBusiness?.id} timeRange={30} currentBusiness={currentBusiness} />}
        {activePage === 'inbox' && <InboxPage />}
        {activePage === 'invoices' && <InvoiceManagement />}
        {activePage === 'budgets' && <BudgetsPage />}
        {activePage === 'mileage' && <MileagePage />}
        {activePage === 'pnl' && <ProfitLossPage />}
        {activePage === 'businesses' && <BusinessManagementPage />}
        {activePage === 'settings' && <SettingsPage />}

        {activePage === 'dashboard' && (
        <div className="p-6">
          {/* Welcome message for new users */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
            <h2 className="text-lg font-semibold mb-2">Welcome to your Dashboard!</h2>
            <p className="text-gray-400 text-sm">
              Use the + button below to add expenses, or explore your business insights.
            </p>
          </div>
          
          {/* Financial Overview - Revenue & Net Worth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Revenue Card */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-green-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Revenue</h3>
                  <p className="text-xs text-gray-400">Year-to-Date (All Businesses + Personal)</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-4xl font-bold text-green-400 mb-2">
                ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {revenueChange !== 0 && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <TrendingUp className={`w-4 h-4 ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs last year
                  </span>
                </div>
              )}
              {/* Mini revenue trend chart */}
              {revenueTrendData.length > 0 && (
                <div className="h-16 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData}>
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Net Worth</h3>
                  <p className="text-xs text-gray-400">All Businesses + Personal</p>
                </div>
                <Wallet className="w-8 h-8 text-purple-400" />
              </div>
              <p className={`text-4xl font-bold mb-2 ${netWorth >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                ${Math.abs(netWorth).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-[#252a45]/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Assets</p>
                  <p className="text-lg font-bold text-green-400">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-[#252a45]/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Liabilities</p>
                  <p className="text-lg font-bold text-red-400">${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live KPI Cards */}
          <LiveKPICards 
            selectedBusinesses={selectedBusinesses}
            timeRange={timeRange}
            compareMode={compareMode}
          />

          {/* Controls Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <SmartTimeSlider 
                onTimeRangeChange={handleTimeRangeChange}
                initialRange={timeRange}
              />
            </div>
            <div>
              <CrossBusinessFilter
                onBusinessToggle={handleBusinessToggle}
                onCompareModeToggle={setCompareMode}
                selectedBusinesses={selectedBusinesses}
                compareMode={compareMode}
              />
            </div>
          </div>

          {/* Compact Charts Grid */}
          <CompactCharts 
            selectedBusinesses={selectedBusinesses}
            timeRange={timeRange}
            compareMode={compareMode}
          />

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HeatmapCalendar 
                selectedBusinesses={selectedBusinesses}
                timeRange={timeRange}
                compareMode={compareMode}
              />
            </div>
            <div className="space-y-6">
              <LivePLBadge 
                selectedBusinesses={selectedBusinesses}
                timeRange={timeRange}
                compareMode={compareMode}
              />
              <AIInsightCard 
                selectedBusinesses={selectedBusinesses}
                timeRange={timeRange}
                compareMode={compareMode}
              />
            </div>
          </div>
        </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1d2e]/95 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="flex items-center justify-around px-4 py-3">
          <button
            onClick={() => setActivePage('dashboard')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'dashboard' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActivePage('inbox')}
            className={`flex flex-col items-center gap-1 transition relative ${
              activePage === 'inbox' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span className="text-xs font-medium">Inbox</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePage('invoices')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'invoices' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs font-medium">Invoices</span>
          </button>

          <button
            onClick={() => setShowVoiceModal(true)}
            className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-purple-500/50"
          >
            <Plus className="w-8 h-8" />
          </button>

          <button
            onClick={() => setActivePage('pnl')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'pnl' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">P&L</span>
          </button>

          <button
            onClick={() => setActivePage('mileage')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'mileage' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">Mileage</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'reports' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Reports</span>
          </button>
        </div>
      </nav>

      {/* Expense Entry Hub */}
      {showVoiceModal && (
        <ExpenseEntryHub
          businesses={businesses}
          initialMode={expenseEntryMode}
          initialBusinessId={currentBusiness?.id}
          onClose={() => {
            setShowVoiceModal(false);
            setExpenseEntryMode('voice');
          }}
          onExpenseAdded={(expense) => {
            console.log('Expense added:', expense);
          }}
        />
      )}

      {/* Smart Chat Agent Modal */}
      {showChatAgent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-3xl h-[600px] border border-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-2xl font-bold">Chat</h3>
                <p className="text-sm text-gray-400">Your AI expense assistant</p>
              </div>
              <button
                onClick={() => setShowChatAgent(false)}
                className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="bg-[#252a41] rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-sm">
                      Hi! I'm your expense assistant. You can:
                    </p>
                    <ul className="text-sm text-gray-300 mt-2 space-y-1 ml-4 list-disc">
                      <li>Chat naturally about expenses</li>
                      <li>Attach receipts and documents</li>
                      <li>I'll help extract and organize data</li>
                      <li>Review and confirm before saving</li>
                    </ul>
                    <p className="text-sm mt-2">What would you like to add today?</p>
                  </div>
                </div>

                {/* Example User Message with Attachments */}
                {attachedFiles.length > 0 && (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-[#5b6ef6] rounded-2xl rounded-tr-none p-4 max-w-md">
                      <p className="text-sm mb-3">I have a receipt to upload</p>
                      <div className="space-y-2">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="bg-white/10 rounded-lg p-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-xs">{file}</span>
                            </div>
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachment Preview */}
            {attachedFiles.length > 0 && (
              <div className="px-6 pb-3">
                <div className="flex gap-2 flex-wrap">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="bg-[#252a41] rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-[#5b6ef6]" />
                      <span>{file}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="hover:text-red-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-white/5">
              <div className="flex gap-3">
                <div className="flex-1 bg-[#252a41] rounded-xl flex items-center gap-3 px-4">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type message, ask questions, or describe expense..."
                    className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleFileAttach}
                      className="text-gray-400 hover:text-white transition"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button className="px-6 py-3 bg-[#5b6ef6] hover:bg-[#4a5ee5] rounded-xl font-semibold transition">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Attach files up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

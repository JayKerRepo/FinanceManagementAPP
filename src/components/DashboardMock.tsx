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
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardMock() {
  const [activePage, setActivePage] = useState('dashboard');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const currentBusiness = {
    name: 'Chase Fargo Pass B020:08',
    description: 'Retail & Restaurants',
    avatar: '/api/placeholder/40/40'
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
                <span className="text-sm text-gray-400">Harshal's businesses overview</span>
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

            <button
              onClick={() => setActivePage('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activePage === 'settings' ? 'bg-[#2d3248] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252a41]'
              }`}
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Settings</span>}
            </button>
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#252a41] rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                  CF
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentBusiness.name}</p>
                  <p className="text-xs text-gray-400 truncate">{currentBusiness.description}</p>
                </div>
              </div>
              <button className="w-full py-3 bg-[#5b6ef6] hover:bg-[#4a5ee5] rounded-xl font-semibold transition">
                Add New Business
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} pb-20`}>
        <header className="bg-[#1a1d2e]/50 backdrop-blur-xl border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Good morning, Sarah</h1>
              <p className="text-sm text-gray-400">Here's your business overview</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-[#5b6ef6] hover:bg-[#4a5ee5] rounded-xl font-semibold transition">
                <Plus className="w-5 h-5 inline mr-2" />
                Add Entry
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards - Smaller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#5b6ef6] to-[#8b5cf6] p-4 rounded-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm opacity-90">Total Balance</p>
                      <Eye className="w-4 h-4 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold mb-1">$24,634.49</p>
                    <p className="text-xs opacity-75">+12% vs last month</p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="bg-[#1a1d2e] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">Outstanding Invoices</p>
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold mb-1">$6,347 <span className="text-sm text-red-400">missing</span></p>
                </div>

                <div className="bg-[#1a1d2e] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">Current P&L</p>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold mb-1">$3,550.00</p>
                </div>
              </div>

              {/* Income & Expenses Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1d2e] p-4 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-400 mb-2">Income</p>
                  <p className="text-2xl font-bold mb-1">$8,247.50</p>
                  <p className="text-xs text-green-400">+8.2%</p>
                </div>

                <div className="bg-[#1a1d2e] p-4 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-400 mb-2">Expenses</p>
                  <p className="text-2xl font-bold mb-1">$4,127.30</p>
                  <p className="text-xs text-red-400">-3.1%</p>
                </div>
              </div>

              {/* Voice Assistant & Smart Chat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1d2e] p-6 rounded-2xl border border-white/5">
                  <h2 className="text-xl font-bold mb-4">Voice Assistant</h2>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-6">Ask me anything<br />about your finances</p>
                    <button
                      onClick={() => setShowVoiceModal(true)}
                      className="relative group mx-auto mb-4"
                    >
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-full flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105">
                        <div className="absolute inset-0 bg-purple-600/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                        <Mic className="w-16 h-16 relative z-10" />
                      </div>
                    </button>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Ready
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1d2e] p-6 rounded-2xl border border-white/5">
                  <h2 className="text-xl font-bold mb-4">Chat</h2>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-6">Ask questions or add expenses naturally</p>
                    <button
                      onClick={() => setShowChatAgent(true)}
                      className="w-full py-4 bg-gradient-to-r from-[#5b6ef6] to-[#8b5cf6] rounded-xl font-semibold hover:scale-105 transition flex items-center justify-center gap-3"
                    >
                      <MessageSquare className="w-6 h-6" />
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Month's Breakdown */}
            <div className="space-y-6">
              <div className="bg-[#1a1d2e] p-6 rounded-2xl border border-white/5">
                <h2 className="text-xl font-bold mb-6">This Month's Breakdown</h2>

                {/* Donut Chart */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#2d3248"
                      strokeWidth="32"
                    />
                    {monthBreakdown.map((item, index) => {
                      const prevPercentage = monthBreakdown
                        .slice(0, index)
                        .reduce((sum, i) => sum + i.percentage, 0);
                      const circumference = 2 * Math.PI * 80;
                      const offset = (prevPercentage / 100) * circumference;
                      const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`;

                      return (
                        <circle
                          key={item.category}
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="32"
                          strokeDasharray={dashArray}
                          strokeDashoffset={-offset}
                          className="transition-all duration-300"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold">${totalSpent.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Spent</p>
                  </div>
                </div>

                {/* Category Legend */}
                <div className="space-y-3">
                  {monthBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-300">{item.category}</span>
                      </div>
                      <span className="text-sm font-bold">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-[#1a1d2e] p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-[#252a41] p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-xl">
                          {transaction.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1">{transaction.title}</p>
                          <p className="text-xs text-gray-400 mb-2">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                        <p className={`text-lg font-bold ${transaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1d2e]/95 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="flex items-center justify-around px-6 py-4">
          <button
            onClick={() => setActivePage('dashboard')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'dashboard' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button className="text-gray-400 hover:text-white transition">
            <ChevronRight className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowVoiceModal(true)}
            className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-purple-500/50"
          >
            <Plus className="w-8 h-8" />
          </button>

          <button
            onClick={() => setActivePage('accounts')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'accounts' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-xs font-medium">Accounts</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className={`flex flex-col items-center gap-1 transition ${
              activePage === 'reports' ? 'text-[#5b6ef6]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Reports</span>
          </button>
        </div>
      </nav>

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl p-8 max-w-2xl w-full border border-white/10">
            <div className="text-center mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-purple-600/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <Mic className="w-16 h-16 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Smart Expense Entry</h3>
              <p className="text-gray-400">
                Voice, chat, or upload receipt - I'll handle the rest
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#252a41] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-[#5b6ef6]" />
                  <span className="font-semibold">Chat Input</span>
                </div>
                <input
                  type="text"
                  placeholder="Type expense details: '$50 coffee at Starbucks for consulting business'"
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#5b6ef6] focus:outline-none"
                />
              </div>

              <div className="bg-[#252a41] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="w-5 h-5 text-[#5b6ef6]" />
                  <span className="font-semibold">Upload Receipt (OCR)</span>
                </div>
                <button className="w-full py-3 bg-[#1a1d2e] border border-dashed border-white/20 rounded-lg text-gray-400 hover:border-[#5b6ef6] hover:text-white transition">
                  Click to upload or drag & drop
                </button>
              </div>

              <div className="bg-[#252a41] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Camera className="w-5 h-5 text-[#5b6ef6]" />
                  <span className="font-semibold">Scan Receipt</span>
                </div>
                <button className="w-full py-3 bg-[#5b6ef6] hover:bg-[#4a5ee5] rounded-lg font-semibold transition">
                  Open Camera
                </button>
              </div>
            </div>

            <div className="mt-6 bg-[#252a41] rounded-xl p-4">
              <p className="text-sm text-gray-400 text-center">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Voice assistant is listening...
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVoiceModal(false)}
                className="flex-1 py-3 bg-[#252a41] rounded-xl font-semibold hover:bg-[#2d3248] transition"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-[#5b6ef6] hover:bg-[#4a5ee5] rounded-xl font-semibold transition">
                Review & Submit
              </button>
            </div>
          </div>
        </div>
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

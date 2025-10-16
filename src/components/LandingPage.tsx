import { Mic, Receipt, TrendingUp, Building2, Globe, Shield, Zap, CheckCircle, Play, ArrowRight, Camera } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessType: ''
  });

  const handleLeadCapture = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Lead captured:', formData);
    setShowLeadModal(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1d2e]">
      <header className="fixed top-0 w-full z-50 bg-[#1a1d2e]/80 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">ExpenseIQ</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
            <a href="/demo" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/demo'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-gray-400 hover:text-white transition">Demo</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
            <button onClick={() => { window.history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-gray-400 hover:text-white transition">Login</button>
            <button onClick={() => { window.history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition">
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#252a41] rounded-full mb-6 border border-[#5b6ef6]/20">
                <Zap className="w-4 h-4 text-[#5b6ef6]" />
                <span className="text-sm text-gray-300">AI-Powered Finance Management</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Smart Expense.{' '}
                <span className="bg-gradient-to-r from-[#6B8AFF] to-[#8B7CFF] bg-clip-text text-transparent">Unified Business Hub.</span>{' '}
                Zero Chaos.
              </h1>

              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Speak it. Snap it. Sorted, powered by AI
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => { window.history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="bg-gradient-to-r from-[#10B981] to-[#059669] px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  Start Your Smart Finance Journey
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { window.history.pushState({}, '', '/demo'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="bg-[#1a2332] border border-white/10 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#252a41] transition flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-4 mt-10">
                <div className="flex items-center text-yellow-400">
                  <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                </div>
                <div className="text-sm text-gray-400">
                  4.9/5 by 2,000+ business owners — join the next big thing in business finance.
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#252a41] rounded-3xl p-8 card-glow border border-white/5">
                <div className="bg-gradient-to-br from-[#5b6ef6] to-[#8b5cf6] rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm opacity-90">Total Balance</span>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2">$24,573.89</div>
                  <div className="text-sm opacity-90">+12.5% from last month</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#1a1d2e] rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-2">Income</div>
                    <div className="text-2xl font-bold">$8,247.50</div>
                    <div className="text-xs text-green-400">+8.2%</div>
                  </div>
                  <div className="bg-[#1a1d2e] rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-2">Expenses</div>
                    <div className="text-2xl font-bold">$4,127.30</div>
                    <div className="text-xs text-red-400">-3.1%</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-4">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-[#5b6ef6] p-4 rounded-xl hover:bg-[#6b7bff] transition flex flex-col items-center gap-2">
                      <Mic className="w-6 h-6" />
                      <span className="text-sm font-medium">Voice Entry</span>
                    </button>
                    <button className="bg-[#8b5cf6] p-4 rounded-xl hover:bg-[#9333ea] transition flex flex-col items-center gap-2">
                      <Receipt className="w-6 h-6" />
                      <span className="text-sm font-medium">Scan Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-[#151827]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in <span className="text-gradient">One Platform</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for entrepreneurs, freelancers, and multi-business owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#6B7CFF] to-[#5B6EF6] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant Smart Capture</h3>
              <p className="text-gray-400 leading-relaxed">
                Snap receipts, speak expenses, or sync accounts. Our AI instantly captures and categorizes everything.
              </p>
            </div>

            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Voice-Powered Commands</h3>
              <p className="text-gray-400 leading-relaxed">
                Just speak your expenses while driving, walking, or working. Hands-free finance management that fits your lifestyle.
              </p>
            </div>

            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#EC4899] to-[#DB2777] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Unified Business Hub</h3>
              <p className="text-gray-400 leading-relaxed">
                Manage multiple businesses from one dashboard. Switch between ventures seamlessly and track everything in one place.
              </p>
            </div>

            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-time AI Insights</h3>
              <p className="text-gray-400 leading-relaxed">
                Get instant P&L reports, spending trends, and tax insights across all your businesses.
              </p>
            </div>

            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fast, Frictionless Setup</h3>
              <p className="text-gray-400 leading-relaxed">
                Get started in minutes. No complex integrations. Just sign up, set up, and start managing your finances.
              </p>
            </div>

            <div className="bg-[#1a2332] p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Bank-Level Security</h3>
              <p className="text-gray-400 leading-relaxed">
                Your financial data is encrypted and protected with industry-leading security standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See ExpenseIQ in <span className="text-gradient">Action</span>
            </h2>
            <p className="text-xl text-gray-400">
              Experience how easy it is to manage your business finances
            </p>
          </div>

          <div className="relative min-h-[500px]">
            {/* Demo page embedded in bottom right corner - hidden on mobile */}
            <div className="hidden lg:block absolute bottom-0 right-0 w-80 h-96 z-10">
              <div className="bg-[#1a1d2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden card-glow">
                <div className="p-4 bg-gradient-to-r from-[#5b6ef6] to-[#8b5cf6]">
                  <h3 className="font-bold text-sm mb-1">ExpenseIQ Demo</h3>
                  <p className="text-xs opacity-90">Live Interactive Preview</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="bg-[#252a41] p-3 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Total Balance</p>
                    <p className="text-2xl font-bold text-gradient">$24,573.89</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#252a41] p-3 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Income</p>
                      <p className="text-lg font-bold text-green-400">$8,450</p>
                    </div>
                    <div className="bg-[#252a41] p-3 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Expenses</p>
                      <p className="text-lg font-bold text-red-400">$3,210</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full gradient-blue py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:scale-105 transition">
                      <Mic className="w-4 h-4" />
                      Voice Entry
                    </button>
                    <button className="w-full bg-[#252a41] py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d3350] transition">
                      <Camera className="w-4 h-4" />
                      Scan Receipt
                    </button>
                  </div>

                  <div className="bg-[#252a41] p-3 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Office Supplies</span>
                        <span className="text-red-400">-$156</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Client Payment</span>
                        <span className="text-green-400">+$2,500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="bg-[#252a41] rounded-3xl overflow-hidden border border-white/5 card-glow lg:pr-96">
              <div className="aspect-video bg-gradient-to-br from-[#5b6ef6]/20 to-[#8b5cf6]/20 flex items-center justify-center p-8 md:p-12">
                <div className="text-center">
                  <div className="w-20 h-20 gradient-blue rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition card-glow cursor-pointer">
                    <Play className="w-10 h-10 ml-1" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">Interactive Demo</h3>
                  <p className="text-gray-400 text-sm md:text-base">
                    <span className="hidden lg:inline">Check out the live preview on the right</span>
                    <span className="lg:hidden">Experience the full dashboard</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6 bg-[#151827]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-gradient">Transparent Pricing</span>
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#252a41] p-8 rounded-2xl border border-white/5">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">1 Business</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">50 Receipts/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Basic Reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Mobile App</span>
                </li>
              </ul>
              <button className="w-full bg-[#1a1d2e] py-3 rounded-xl font-semibold hover:bg-[#252a41] transition">
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#5b6ef6] to-[#8b5cf6] p-8 rounded-2xl border border-white/10 card-glow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-[#5b6ef6] px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">$29</span>
                <span className="opacity-90">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Unlimited Businesses</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Unlimited Receipts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>AI Voice Assistant</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <button className="w-full bg-white text-[#5b6ef6] py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
                Start Free Trial
              </button>
            </div>

            <div className="bg-[#252a41] p-8 rounded-2xl border border-white/5">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Custom Integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Dedicated Account Manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">SLA & Compliance</span>
                </li>
              </ul>
              <button className="w-full bg-[#1a1d2e] py-3 rounded-xl font-semibold hover:bg-[#252a41] transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your <span className="text-gradient">Finance Management?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of businesses already using ExpenseIQ to save time and maximize profits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { window.history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="bg-gradient-to-r from-[#10B981] to-[#059669] px-10 py-5 rounded-xl font-semibold text-xl hover:opacity-90 transition shadow-lg shadow-green-500/30 inline-flex items-center justify-center gap-2"
            >
              Start Your Smart Finance Journey
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={() => { window.history.pushState({}, '', '/demo'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="bg-[#1a2332] border border-white/10 px-10 py-5 rounded-xl font-semibold text-xl hover:bg-[#252a41] transition inline-flex items-center justify-center gap-2 group"
            >
              <Play className="w-6 h-6 group-hover:scale-110 transition" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#151827] border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">ExpenseIQ</span>
              </div>
              <p className="text-gray-400">
                AI-powered finance management for modern businesses
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Demo</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ExpenseIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#252a41] rounded-3xl p-8 max-w-md w-full border border-white/10 card-glow">
            <h3 className="text-3xl font-bold mb-2">Start Your Journey</h3>
            <p className="text-gray-400 mb-6">Join the waitlist and be the first to experience ExpenseIQ</p>

            <form onSubmit={handleLeadCapture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5b6ef6] transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5b6ef6] transition"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5b6ef6] transition"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type (Optional)</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5b6ef6] transition"
                >
                  <option value="">Select...</option>
                  <option value="freelance">Freelancer</option>
                  <option value="startup">Startup</option>
                  <option value="smb">Small Business</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="flex-1 bg-[#1a1d2e] py-3 rounded-xl font-semibold hover:bg-[#252a41] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gradient-blue py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Join Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

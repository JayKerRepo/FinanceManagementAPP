'use client'

import { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Calendar, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Building2, 
  User,
  Download,
  Filter
} from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { useSpring, animated } from 'react-spring';
import { ErrorBoundary } from '../ErrorBoundary';

// Lazy load report components
const WeeklyReport = lazy(() => import('./WeeklyReport'));
const MonthlyReport = lazy(() => import('./MonthlyReport'));
const QuarterlyReport = lazy(() => import('./QuarterlyReport'));
const AnnualReport = lazy(() => import('./AnnualReport'));
const BudgetAnalysisReport = lazy(() => import('./BudgetAnalysisReport'));
const MultiBusinessReport = lazy(() => import('./MultiBusinessReport'));
const PersonalFinanceReport = lazy(() => import('./PersonalFinanceReport'));

interface ReportTab {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType<any>;
}

interface ReportsTabsProps {
  businessId?: string | null;
  timeRange?: number;
  currentBusiness?: any;
}

export default function ReportsTabs({ businessId, timeRange, currentBusiness }: ReportsTabsProps) {
  const { businesses } = useBusiness();
  const [activeTab, setActiveTab] = useState('weekly');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [timeRangeState, setTimeRangeState] = useState('30');

  const reportTabs: ReportTab[] = [
    { id: 'weekly', label: 'Weekly', icon: Calendar, component: WeeklyReport },
    { id: 'monthly', label: 'Monthly', icon: BarChart3, component: MonthlyReport },
    { id: 'quarterly', label: 'Quarterly', icon: PieChart, component: QuarterlyReport },
    { id: 'annual', label: 'Annual', icon: TrendingUp, component: AnnualReport },
    { id: 'budget', label: 'Budget Analysis', icon: BarChart3, component: BudgetAnalysisReport },
    { id: 'multi-business', label: 'Multi-Business', icon: Building2, component: MultiBusinessReport },
    { id: 'personal', label: 'Personal Finance', icon: User, component: PersonalFinanceReport },
  ];

  const timeRanges = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '365', label: '1 year' },
  ];

  const ActiveComponent = reportTabs.find(tab => tab.id === activeTab)?.component || WeeklyReport;

  // Animation for tab transitions
  const tabAnimation = useSpring({
    opacity: 1,
    transform: 'translateY(0px)',
    from: { opacity: 0, transform: 'translateY(20px)' },
    config: { tension: 300, friction: 30 }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2d3352] rounded-xl hover:bg-[#373d5f] transition">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:scale-105 transition">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Business Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Business:</span>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="bg-[#2d3352] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Businesses</option>
              {businesses.map(business => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Range:</span>
            <div className="flex gap-1 bg-[#1e2337] p-1 rounded-lg">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRangeState(range.value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    timeRangeState === range.value
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {reportTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2d3352]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <animated.div style={tabAnimation} className="p-6">
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Report Error</h3>
              <p className="text-gray-400">Failed to load report. Please try again.</p>
            </div>
          </div>
        }>
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }>
            <ActiveComponent 
              businessId={selectedBusiness === 'all' ? null : selectedBusiness}
              timeRange={parseInt(timeRangeState)}
              currentBusiness={currentBusiness}
            />
          </Suspense>
        </ErrorBoundary>
      </animated.div>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';
import { TimeRange } from './SmartTimeSlider';

interface HeatmapData {
  date: string;
  amount: number;
  intensity: number; // 0-4 scale
}

interface HeatmapCalendarProps {
  selectedBusinesses?: string[];
  timeRange?: TimeRange;
  compareMode?: boolean;
}

export default function HeatmapCalendar({ selectedBusinesses, timeRange, compareMode }: HeatmapCalendarProps) {
  const { currentBusiness } = useBusiness();
  
  if (!currentBusiness) {
    return (
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;

    const fetchHeatmapData = async () => {
      try {
        // Use timeRange prop if provided, otherwise default to 90 days
        let startDate: Date;
        let endDate = new Date();
        let daysToShow = 90;
        
        if (timeRange) {
          startDate = new Date(timeRange.start);
          endDate = new Date(timeRange.end);
          daysToShow = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
        }

        let query = supabase
          .from('transactions')
          .select('date, amount')
          .eq('transaction_type', 'expense')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        // Handle selectedBusinesses if provided
        if (selectedBusinesses && selectedBusinesses.length > 0) {
          query = query.in('business_id', selectedBusinesses);
        } else {
          query = query.eq('business_id', currentBusiness.id);
        }

        const { data: transactions } = await query;

        if (transactions) {
          // Group by date and calculate daily totals
          const dailyTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            dailyTotals[transaction.date] = (dailyTotals[transaction.date] || 0) + transaction.amount;
          });

          // Calculate intensity levels
          const amounts = Object.values(dailyTotals);
          const maxAmount = Math.max(...amounts);
          const minAmount = Math.min(...amounts);
          const range = maxAmount - minAmount;

          const heatmapArray = Object.entries(dailyTotals).map(([date, amount]) => {
            const intensity = range > 0 ? Math.floor(((amount - minAmount) / range) * 4) : 0;
            return { date, amount, intensity };
          });

          setHeatmapData(heatmapArray);
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      }
    };

    fetchHeatmapData();
  }, [currentBusiness, timeRange, selectedBusinesses]);

  const getIntensityColor = (intensity: number) => {
    // Sunset yellow/orange gradient colors
    const colors = [
      '#374151', // 0 - no activity (gray)
      '#FCD34D', // 1 - low (Light Sunset Yellow)
      '#FB923C', // 2 - medium-low (Medium Sunset Orange)
      '#EA580C', // 3 - medium-high (Medium-Dark Sunset Orange)
      '#B91C1C', // 4 - high (Bright Dark Sunset Orange)
    ];
    return colors[intensity] || colors[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  // Generate calendar grid based on timeRange
  const generateCalendarGrid = () => {
    const grid = [];
    const today = new Date();
    
    // Calculate days to show based on timeRange or default to 90
    let daysToShow = 90;
    let startDate = new Date();
    if (timeRange) {
      startDate = new Date(timeRange.start);
      const endDate = new Date(timeRange.end);
      daysToShow = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      startDate.setDate(startDate.getDate() - 90);
    }
    
    // Generate grid for the calculated range
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayData = heatmapData.find(d => d.date === dateString);
      const intensity = dayData?.intensity || 0;
      const amount = dayData?.amount || 0;
      
      grid.push({
        date: dateString,
        intensity,
        amount,
        dayOfWeek: getDayOfWeek(dateString),
        isToday: dateString === today.toISOString().split('T')[0]
      });
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Spending Heatmap</h3>
        <div className="text-sm text-gray-400">
          {timeRange ? timeRange.label : 'Last 90 days'}
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs text-gray-400 font-semibold py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar squares */}
        {calendarGrid.map((day, index) => (
          <div
            key={day.date}
            className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${
              selectedDate === day.date ? 'ring-2 ring-white' : ''
            } ${day.isToday ? 'ring-1 ring-blue-400' : ''}`}
            style={{ backgroundColor: getIntensityColor(day.intensity) }}
            onClick={() => setSelectedDate(selectedDate === day.date ? null : day.date)}
            title={`${formatDate(day.date)}: $${day.amount.toFixed(2)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getIntensityColor(level) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-[#2d3248] rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">{formatDate(selectedDate)}</span>
            <span className="ml-2">
              ${heatmapData.find(d => d.date === selectedDate)?.amount.toFixed(2) || '0.00'}
            </span>
          </p>
          <button 
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => {
              // TODO: Open transaction list filtered by date
              // This should open a modal or navigate to transactions filtered by date
            }}
          >
            View transactions →
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div className="text-center">
          <div className="text-white font-semibold">
            ${heatmapData.reduce((sum, d: { amount: number }) => sum + d.amount, 0).toFixed(0)}
          </div>
          <div className="text-gray-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">
            ${(heatmapData.reduce((sum, d: { amount: number }) => sum + d.amount, 0) / 90).toFixed(0)}
          </div>
          <div className="text-gray-400">Daily Avg</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">
            {heatmapData.length}
          </div>
          <div className="text-gray-400">Active Days</div>
        </div>
      </div>
    </div>
  );
}

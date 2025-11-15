'use client'

import { useState, useEffect } from 'react';
import { Calendar, Clock, ZoomIn, ZoomOut } from 'lucide-react';
import { useSpring, animated } from 'react-spring';

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface SmartTimeSliderProps {
  onTimeRangeChange: (range: TimeRange) => void;
  initialRange?: TimeRange;
}

export default function SmartTimeSlider({ onTimeRangeChange, initialRange }: SmartTimeSliderProps) {
  const [currentRange, setCurrentRange] = useState<TimeRange>(
    initialRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      label: 'Last 30 days',
      type: 'month'
    }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Predefined time ranges for quick selection
  const quickRanges: TimeRange[] = [
    {
      start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Today',
      type: 'day'
    },
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 7 days',
      type: 'week'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 30 days',
      type: 'month'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 90 days',
      type: 'quarter'
    },
    {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last year',
      type: 'year'
    }
  ];

  // Calculate slider position (0-100%)
  const getSliderPosition = (range: TimeRange) => {
    const totalDays = 365; // Max range
    const daysFromStart = Math.floor((range.start.getTime() - (new Date().getTime() - totalDays * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  // Calculate range width (0-100%)
  const getRangeWidth = (range: TimeRange) => {
    const totalDays = 365;
    const rangeDays = Math.floor((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(5, Math.min(100, (rangeDays / totalDays) * 100));
  };

  const handleRangeSelect = (range: TimeRange) => {
    setCurrentRange(range);
    onTimeRangeChange(range);
  };

  const handleSliderDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    const totalDays = 365;
    const daysFromStart = Math.floor((percentage / 100) * totalDays);
    
    const newStart = new Date(Date.now() - (totalDays - daysFromStart) * 24 * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + (currentRange.end.getTime() - currentRange.start.getTime()));
    
    const newRange: TimeRange = {
      start: newStart,
      end: newEnd,
      label: `${Math.floor((newEnd.getTime() - newStart.getTime()) / (24 * 60 * 60 * 1000))} days`,
      type: currentRange.type
    };
    
    setCurrentRange(newRange);
    onTimeRangeChange(newRange);
  };

  const zoomIn = () => {
    const currentDays = Math.floor((currentRange.end.getTime() - currentRange.start.getTime()) / (24 * 60 * 60 * 1000));
    const newDays = Math.max(1, Math.floor(currentDays * 0.7));
    const center = new Date((currentRange.start.getTime() + currentRange.end.getTime()) / 2);
    
    const newRange: TimeRange = {
      start: new Date(center.getTime() - (newDays * 24 * 60 * 60 * 1000) / 2),
      end: new Date(center.getTime() + (newDays * 24 * 60 * 60 * 1000) / 2),
      label: `${newDays} days`,
      type: currentRange.type
    };
    
    setCurrentRange(newRange);
    onTimeRangeChange(newRange);
  };

  const zoomOut = () => {
    const currentDays = Math.floor((currentRange.end.getTime() - currentRange.start.getTime()) / (24 * 60 * 60 * 1000));
    const newDays = Math.min(365, Math.floor(currentDays * 1.3));
    const center = new Date((currentRange.start.getTime() + currentRange.end.getTime()) / 2);
    
    const newRange: TimeRange = {
      start: new Date(center.getTime() - (newDays * 24 * 60 * 60 * 1000) / 2),
      end: new Date(center.getTime() + (newDays * 24 * 60 * 60 * 1000) / 2),
      label: `${newDays} days`,
      type: currentRange.type
    };
    
    setCurrentRange(newRange);
    onTimeRangeChange(newRange);
  };

  const sliderAnimation = useSpring({
    left: `${getSliderPosition(currentRange)}%`,
    width: `${getRangeWidth(currentRange)}%`,
    config: { tension: 300, friction: 30 }
  });

  return (
    <div className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-300">Time Range</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={zoomIn}
            className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Range Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {quickRanges.map((range, index) => (
          <button
            key={index}
            onClick={() => handleRangeSelect(range)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              currentRange.label === range.label
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Smart Slider */}
      <div className="relative">
        <div className="h-2 bg-gray-700 rounded-full relative overflow-hidden">
          <animated.div
            className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full cursor-pointer"
            style={sliderAnimation}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart(e.clientX);
            }}
            onMouseMove={handleSliderDrag}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          />
        </div>
        
        {/* Time Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{currentRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span className="font-semibold text-blue-400">{currentRange.label}</span>
          <span>{currentRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500">
        <p>Drag to pan • Shift+drag to zoom • Use +/- buttons for precise control</p>
      </div>
    </div>
  );
}


'use client'

import { useState, useEffect } from 'react';
import { Building2, Users, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { useSpring, animated } from 'react-spring';

interface BusinessFilter {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}

interface CrossBusinessFilterProps {
  onBusinessToggle: (businessId: string, enabled: boolean) => void;
  onCompareModeToggle: (enabled: boolean) => void;
  selectedBusinesses: string[];
  compareMode: boolean;
}

export default function CrossBusinessFilter({ 
  onBusinessToggle, 
  onCompareModeToggle, 
  selectedBusinesses, 
  compareMode 
}: CrossBusinessFilterProps) {
  const { businesses } = useBusiness();
  const [businessFilters, setBusinessFilters] = useState<BusinessFilter[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Color palette for businesses
  const businessColors = [
    '#4F7CFF', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
  ];

  useEffect(() => {
    const filters = businesses.map((business, index) => ({
      id: business.id,
      name: business.name,
      enabled: selectedBusinesses.includes(business.id),
      color: businessColors[index % businessColors.length]
    }));
    setBusinessFilters(filters);
  }, [businesses, selectedBusinesses]);

  const handleBusinessToggle = (businessId: string) => {
    const newEnabled = !businessFilters.find(b => b.id === businessId)?.enabled;
    onBusinessToggle(businessId, newEnabled);
  };

  const handleSelectAll = () => {
    businesses.forEach(business => {
      if (!selectedBusinesses.includes(business.id)) {
        onBusinessToggle(business.id, true);
      }
    });
  };

  const handleSelectNone = () => {
    selectedBusinesses.forEach(businessId => {
      onBusinessToggle(businessId, false);
    });
  };

  const toggleAnimation = useSpring({
    transform: compareMode ? 'translateX(0px)' : 'translateX(-20px)',
    config: { tension: 300, friction: 30 }
  });

  return (
    <div className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-300">Business Filter</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            title={showAll ? "Show Less" : "Show All"}
          >
            {showAll ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Compare Mode Toggle */}
      <div className="flex items-center justify-between mb-4 p-3 bg-[#252a41] rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">Compare Mode</span>
        </div>
        <button
          onClick={() => onCompareModeToggle(!compareMode)}
          className="flex items-center gap-2"
        >
          {compareMode ? (
            <ToggleRight className="w-6 h-6 text-purple-400" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-500" />
          )}
        </button>
      </div>

      {/* Business Toggles */}
      <div className="space-y-2">
        {businessFilters.slice(0, showAll ? businessFilters.length : 3).map((business) => (
          <div
            key={business.id}
            className="flex items-center justify-between p-2 bg-[#252a41] rounded-lg hover:bg-[#2d3248] transition"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: business.color }}
              />
              <span className="text-sm text-gray-300 truncate max-w-32">
                {business.name}
              </span>
            </div>
            <button
              onClick={() => handleBusinessToggle(business.id)}
              className="flex items-center gap-2"
            >
              {business.enabled ? (
                <ToggleRight className="w-5 h-5" style={{ color: business.color }} />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSelectAll}
          className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition"
        >
          Select All
        </button>
        <button
          onClick={handleSelectNone}
          className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600 transition"
        >
          Clear All
        </button>
      </div>

      {/* Selected Count */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        {selectedBusinesses.length} of {businesses.length} businesses selected
      </div>

      {/* Compare Mode Info */}
      {compareMode && (
        <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-purple-300">
            Compare mode: Charts will show side-by-side comparison instead of overlaid data
          </p>
        </div>
      )}
    </div>
  );
}








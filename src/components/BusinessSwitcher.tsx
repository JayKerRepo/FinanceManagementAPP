import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';

export default function BusinessSwitcher() {
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentBusiness) return null;

  const getAccountDisplay = (business: any) => {
    return business.name;
  };

  const sortedBusinesses = [...businesses].sort((a, b) => {
    if (a.is_default) return -1;
    if (b.is_default) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-[#1a2332] hover:bg-[#252a41] rounded-xl transition min-w-[250px] border border-white/5"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm truncate">{currentBusiness.name}</div>
          <div className="text-xs text-gray-400 truncate">{currentBusiness.business_type}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a2332] rounded-xl border border-white/10 shadow-2xl shadow-black/50 py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
            Your Businesses
          </div>
          {sortedBusinesses.map((business) => {
            const isSelected = business.id === currentBusiness.id;
            const isDefault = business.is_default;

            return (
              <button
                key={business.id}
                onClick={() => {
                  setCurrentBusiness(business);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-[#252a41] transition ${
                  isSelected ? 'bg-[#252a41]' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{business.name}</span>
                    {isDefault && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{business.business_type}</div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

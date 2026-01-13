'use client'

interface Props {
  businessId?: string | null;
  timeRange: number;
  currentBusiness: any;
}

export default function MultiBusinessReport({ businessId, timeRange, currentBusiness }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Multi-Business Comparison</h2>
        <p className="text-gray-400">Side-by-side comparison charts coming soon...</p>
      </div>
    </div>
  );
}








'use client'

interface Props {
  businessId?: string | null;
  timeRange: number;
  currentBusiness: any;
}

export default function PersonalFinanceReport({ businessId, timeRange, currentBusiness }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Personal Finance</h2>
        <p className="text-gray-400">Personal spending and income analysis coming soon...</p>
      </div>
    </div>
  );
}








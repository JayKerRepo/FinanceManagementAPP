import { useState } from 'react';
import { Check, CreditCard, Plus, X, Zap, Crown, Rocket, Building } from 'lucide-react';

interface SubscriptionManagerProps {
  currentPlan?: string;
  onClose: () => void;
}

export default function SubscriptionManager({ currentPlan = 'free', onClose }: SubscriptionManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showConfirm, setShowConfirm] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Solo Starter',
      price: { monthly: 0, yearly: 0 },
      icon: Zap,
      color: 'from-gray-500 to-gray-600',
      features: [
        '1 business only',
        '1 user',
        'Unlimited invoices',
        'Manual expense entry',
        '20 OCR scans/month',
        'Basic P&L reports',
        'PDF exports only',
        'Community support',
      ],
      limitations: [
        'No AI assistant',
        'No bank sync',
        'No team collaboration',
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Multi-Business Manager',
      price: { monthly: 29, yearly: 290 },
      icon: Rocket,
      color: 'from-blue-500 to-blue-600',
      popular: true,
      features: [
        'Up to 3 businesses',
        '3 users',
        'Unlimited invoices & OCR',
        'Bank & card sync',
        'Multi-business reports',
        'Budget templates',
        'PDF + Excel exports',
        'Email support',
        'Add accountant access',
      ],
      upsells: [
        'Extra business slot: $9/mo',
        'OCR booster: $5/mo',
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      tagline: 'AI + Teams',
      price: { monthly: 59, yearly: 590 },
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        'Unlimited businesses',
        'Unlimited users + roles',
        'AI assistant (voice + chat)',
        'Smart OCR + auto-categorization',
        'AI forecasting & trends',
        'Auto reconciliation',
        'Full approval workflows',
        'Team collaboration',
        'Priority chat support',
        'Recurring invoices',
      ],
      upsells: [
        'Advanced analytics: $10/mo',
        'Tax pro export: $10/mo',
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Finance Suite',
      price: { monthly: 149, yearly: 1490 },
      icon: Building,
      color: 'from-green-500 to-green-600',
      features: [
        'Everything in Growth, plus:',
        'Multi-entity consolidation',
        'Custom permissions',
        'AI policy engine',
        'White-label branding',
        'Custom workflows',
        'Full audit log',
        'API access',
        'Dedicated manager + SLA',
        'QuickBooks, Xero, NetSuite',
      ],
      custom: true
    },
  ];

  const getPlan = (id: string) => plans.find(p => p.id === id);
  const currentPlanData = getPlan(currentPlan);
  const selectedPlanData = getPlan(selectedPlan);

  const handleUpgrade = () => {
    if (selectedPlan === currentPlan) {
      onClose();
      return;
    }
    setShowConfirm(true);
  };

  const confirmUpgrade = () => {
    // Here you would integrate with Stripe/payment processing
    console.log(`Upgrading to ${selectedPlan} - ${billingCycle}`);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-6xl border border-white/10 p-8 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-gray-400">Select the perfect plan for your business needs</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`w-14 h-7 rounded-full transition relative ${
              billingCycle === 'yearly' ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                billingCycle === 'yearly' ? 'right-1' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
              Save 20%
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const isCurrentPlan = plan.id === currentPlan;
            const isSelected = plan.id === selectedPlan;

            return (
              <div
                key={plan.id}
                className={`relative bg-[#252a41] rounded-2xl p-6 border-2 transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 scale-105'
                    : 'border-white/5 hover:border-blue-500/50'
                } ${plan.popular ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1d2e]' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 rounded-full text-xs font-bold">
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 px-4 py-1 bg-green-500 rounded-full text-xs font-bold">
                    Current Plan
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.tagline}</p>

                {plan.custom ? (
                  <div className="mb-6">
                    <p className="text-3xl font-bold">Custom</p>
                    <p className="text-xs text-gray-400">Contact sales</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-4xl font-bold">
                      ${price}
                      <span className="text-lg text-gray-400 font-normal">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </p>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-xs text-gray-400">${(price / 12).toFixed(0)}/mo billed yearly</p>
                    )}
                  </div>
                )}

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <ul className="space-y-2 mb-6 pb-6 border-b border-white/10">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plan.upsells && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Add-ons available:</p>
                    {plan.upsells.map((upsell, index) => (
                      <p key={index} className="text-xs text-gray-500 flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {upsell}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            className={`flex-1 py-4 rounded-xl font-semibold transition ${
              selectedPlan === currentPlan
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
            disabled={selectedPlan === currentPlan}
          >
            {selectedPlan === currentPlan ? 'Current Plan' : selectedPlanData?.custom ? 'Contact Sales' : 'Upgrade Now'}
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && selectedPlanData && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6">
            <div className="bg-[#1a1d2e] rounded-2xl p-8 max-w-md w-full border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Confirm Upgrade</h3>
              <p className="text-gray-400 mb-6">
                You're about to upgrade from <span className="text-white font-semibold">{currentPlanData?.name}</span> to{' '}
                <span className="text-white font-semibold">{selectedPlanData.name}</span> plan.
              </p>
              <div className="bg-[#252a41] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Plan</span>
                  <span className="font-bold">{selectedPlanData.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Billing</span>
                  <span className="font-bold capitalize">{billingCycle}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-blue-400">
                    ${billingCycle === 'monthly' ? selectedPlanData.price.monthly : selectedPlanData.price.yearly}
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpgrade}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

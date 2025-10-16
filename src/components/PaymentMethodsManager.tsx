import { useState } from 'react';
import { CreditCard, Plus, X, Check, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

interface PaymentMethodsManagerProps {
  onClose: () => void;
}

export default function PaymentMethodsManager({ onClose }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      brand: 'Mastercard',
      last4: '5555',
      expMonth: 6,
      expYear: 2026,
      isDefault: false,
    },
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
  });

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  const handleAddCard = () => {
    // Here you would integrate with Stripe to tokenize the card
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      brand: 'Visa', // Would be determined by card number
      last4: newCard.cardNumber.slice(-4),
      expMonth: parseInt(newCard.expMonth),
      expYear: parseInt(newCard.expYear),
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setShowAddCard(false);
    setNewCard({ cardNumber: '', expMonth: '', expYear: '', cvc: '', name: '' });
  };

  const getBrandLogo = (brand: string) => {
    const brandColors: Record<string, string> = {
      Visa: 'from-blue-500 to-blue-600',
      Mastercard: 'from-red-500 to-orange-500',
      Amex: 'from-blue-400 to-blue-500',
      Discover: 'from-orange-500 to-orange-600',
    };
    return brandColors[brand] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment Methods</h2>
            <p className="text-gray-400">Manage your payment methods</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showAddCard ? (
          <>
            {/* Payment Methods List */}
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`bg-[#252a41] rounded-xl p-5 border-2 transition ${
                    method.isDefault ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-12 rounded-lg bg-gradient-to-br ${getBrandLogo(method.brand)} flex items-center justify-center`}>
                      <CreditCard className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{method.brand} •••• {method.last4}</p>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      {method.expMonth && method.expYear && (
                        <p className="text-sm text-gray-400">
                          Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold transition text-sm flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                        disabled={method.isDefault && paymentMethods.length > 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="bg-[#252a41] rounded-xl p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No payment methods added yet</p>
                </div>
              )}
            </div>

            {/* Add Card Button */}
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          </>
        ) : (
          <>
            {/* Add Card Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Card Number</label>
                <input
                  type="text"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  maxLength={19}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Exp Month</label>
                  <input
                    type="text"
                    value={newCard.expMonth}
                    onChange={(e) => setNewCard({ ...newCard, expMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    placeholder="MM"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Exp Year</label>
                  <input
                    type="text"
                    value={newCard.expYear}
                    onChange={(e) => setNewCard({ ...newCard, expYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="YYYY"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">CVC</label>
                  <input
                    type="text"
                    value={newCard.cvc}
                    onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-sm text-blue-400 flex items-start gap-2">
                  <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Your payment information is encrypted and secure. We use industry-standard SSL encryption.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCard(false);
                  setNewCard({ cardNumber: '', expMonth: '', expYear: '', cvc: '', name: '' });
                }}
                className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newCard.cardNumber || !newCard.expMonth || !newCard.expYear || !newCard.cvc || !newCard.name}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Card
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Mic, Calendar, Upload, Camera, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: Props) {
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [business, setBusiness] = useState('');
  const [account, setAccount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxDeductible, setTaxDeductible] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [splitExpense, setSplitExpense] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Office & Admin',
    'Marketing',
    'Travel & Meals',
    'Utilities',
    'Rent',
    'Software',
    'Salary',
    'Other',
  ];

  const businesses = [
    'Chase Fargo Pass B020:08',
    'Tech Startup LLC',
    'Consulting Services Inc',
  ];

  const accounts = [
    'Business Checking - ****4521',
    'Savings Account - ****7832',
    'Credit Card - ****9021',
  ];

  const handleSubmit = () => {
    console.log('Transaction submitted:', {
      type: transactionType,
      amount,
      description,
      category,
      business,
      account,
      date,
      taxDeductible,
      recurring,
      splitExpense,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2337] rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e2337] border-b border-white/10 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#252a45] flex items-center justify-center hover:bg-[#2d3352] transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <button className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition">
            <Mic className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          {/* Transaction Type Tabs */}
          <div className="flex gap-3 bg-[#151827] p-1.5 rounded-2xl">
            <button
              onClick={() => setTransactionType('expense')}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm ${
                transactionType === 'expense'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setTransactionType('income')}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm ${
                transactionType === 'income'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTransactionType('transfer')}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm ${
                transactionType === 'transfer'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              {transactionType === 'income' ? 'Income Amount' : transactionType === 'expense' ? 'Expense Amount' : 'Transfer Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#252a45] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Business */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Business</label>
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className="w-full bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none"
            >
              <option value="">Select business</option>
              {businesses.map((biz) => (
                <option key={biz} value={biz}>{biz}</option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Account</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none"
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition pr-12"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center justify-between bg-[#252a45] rounded-2xl px-4 py-3 border border-white/5">
            <span className="text-sm font-semibold">Tax Deductible</span>
            <button
              onClick={() => setTaxDeductible(!taxDeductible)}
              className={`w-12 h-7 rounded-full transition relative ${
                taxDeductible ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  taxDeductible ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Recurring Transaction */}
          <div className="flex items-center justify-between bg-[#252a45] rounded-2xl px-4 py-3 border border-white/5">
            <span className="text-sm font-semibold">Recurring Transaction</span>
            <button
              onClick={() => setRecurring(!recurring)}
              className={`w-12 h-7 rounded-full transition relative ${
                recurring ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  recurring ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Receipt (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm font-semibold hover:border-blue-500/50 transition flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              <button className="bg-[#252a45] border border-white/5 rounded-2xl px-4 py-3 text-sm font-semibold hover:border-blue-500/50 transition flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Upload
              </button>
            </div>
          </div>

          {/* Split This Expense */}
          <button
            onClick={() => setSplitExpense(!splitExpense)}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${
              splitExpense
                ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                : 'bg-[#252a45] border border-white/5 hover:border-purple-500/50'
            }`}
          >
            <Users className="w-5 h-5" />
            Split This Expense
          </button>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#1e2337] border-t border-white/10 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#252a45] rounded-xl font-semibold hover:bg-[#2d3352] transition"
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold hover:scale-[1.02] transition"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import {
  X, Mic, MessageSquare, Camera, Edit3, Upload, Check,
  Sparkles, Calendar, DollarSign, Tag, Building2, CreditCard,
  FileText, Zap, TrendingUp, AlertCircle, Loader
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
}

interface ExpenseEntryHubProps {
  businesses: Business[];
  onClose: () => void;
  onExpenseAdded?: (expense: any) => void;
  initialMode?: EntryMode;
}

type EntryMode = 'voice' | 'chat' | 'ocr' | 'manual';

interface ParsedExpense {
  amount?: number;
  vendor?: string;
  category?: string;
  business?: string;
  date?: string;
  paymentMethod?: string;
  notes?: string;
}

export default function ExpenseEntryHub({ businesses, onClose, onExpenseAdded, initialMode = 'voice' }: ExpenseEntryHubProps) {
  const [mode, setMode] = useState<EntryMode>(initialMode);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<ParsedExpense | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [manualForm, setManualForm] = useState<ParsedExpense>({
    amount: undefined,
    vendor: '',
    category: '',
    business: businesses[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'credit_card',
    notes: '',
  });

  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<Array<{businessId: string, percentage: number}>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Office & Admin', 'Marketing', 'Travel & Meals', 'Software',
    'Equipment', 'Utilities', 'Professional Services', 'Other'
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'ach', label: 'ACH Transfer' },
    { value: 'check', label: 'Check' },
  ];

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const simulateVoiceRecognition = () => {
    setIsListening(true);
    setTimeout(() => {
      const transcript = "Add $45 for gas for Business Alpha";
      setVoiceTranscript(transcript);
      setIsListening(false);
      parseVoiceCommand(transcript);
    }, 2000);
  };

  const parseVoiceCommand = (text: string) => {
    const amountMatch = text.match(/\$?(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

    const businessMatch = text.match(/for\s+(Business\s+\w+|\w+\s+LLC|\w+\s+Inc)/i);
    const business = businessMatch ? businessMatch[1] : '';

    let category = 'Other';
    if (text.toLowerCase().includes('gas') || text.toLowerCase().includes('fuel')) category = 'Travel & Meals';
    if (text.toLowerCase().includes('software') || text.toLowerCase().includes('subscription')) category = 'Software';
    if (text.toLowerCase().includes('office')) category = 'Office & Admin';

    setManualForm({
      ...manualForm,
      amount,
      vendor: extractVendor(text),
      category,
      business: businesses.find(b => b.name.toLowerCase().includes(business.toLowerCase()))?.id || businesses[0]?.id,
    });
  };

  const extractVendor = (text: string): string => {
    const vendors = ['shell', 'chevron', 'amazon', 'starbucks', 'uber', 'lyft'];
    const found = vendors.find(v => text.toLowerCase().includes(v));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : '';
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);
    setIsProcessing(true);

    setTimeout(() => {
      const parsed = parseChatMessage(chatInput);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Got it! Added $${parsed.amount} expense for ${parsed.vendor || 'unknown vendor'}. Would you like to attach a receipt?`
      }]);
      setManualForm({ ...manualForm, ...parsed });
      setIsProcessing(false);
      setChatInput('');
    }, 1000);
  };

  const parseChatMessage = (text: string): ParsedExpense => {
    const amountMatch = text.match(/\$?(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

    return {
      amount,
      vendor: extractVendor(text),
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsProcessing(true);

      setTimeout(() => {
        const mockOcr: ParsedExpense = {
          amount: 245.50,
          vendor: 'Office Depot',
          category: 'Office & Admin',
          date: new Date().toISOString().split('T')[0],
          notes: 'Receipt scanned via OCR',
        };
        setOcrResult(mockOcr);
        setManualForm({ ...manualForm, ...mockOcr });
        setIsProcessing(false);
      }, 2000);
    }
  };

  const handleSaveExpense = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const expense = {
        ...manualForm,
        id: Date.now().toString(),
        status: 'pending',
        splits: splitMode ? splits : null,
      };

      onExpenseAdded?.(expense);
      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    }, 800);
  };

  const renderModeSelector = () => (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <button
        onClick={() => setMode('voice')}
        className={`p-4 rounded-xl border-2 transition ${
          mode === 'voice'
            ? 'border-cyan-400 bg-cyan-500/20'
            : 'border-white/10 bg-[#252a41] hover:border-cyan-400/50'
        }`}
      >
        <Mic className={`w-6 h-6 mx-auto mb-2 ${mode === 'voice' ? 'text-cyan-400' : 'text-gray-400'}`} />
        <p className="text-xs font-semibold">Voice Entry</p>
      </button>

      <button
        onClick={() => setMode('chat')}
        className={`p-4 rounded-xl border-2 transition ${
          mode === 'chat'
            ? 'border-cyan-400 bg-cyan-500/20'
            : 'border-white/10 bg-[#252a41] hover:border-cyan-400/50'
        }`}
      >
        <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${mode === 'chat' ? 'text-cyan-400' : 'text-gray-400'}`} />
        <p className="text-xs font-semibold">Chat Entry</p>
      </button>

      <button
        onClick={() => setMode('ocr')}
        className={`p-4 rounded-xl border-2 transition ${
          mode === 'ocr'
            ? 'border-cyan-400 bg-cyan-500/20'
            : 'border-white/10 bg-[#252a41] hover:border-cyan-400/50'
        }`}
      >
        <Camera className={`w-6 h-6 mx-auto mb-2 ${mode === 'ocr' ? 'text-cyan-400' : 'text-gray-400'}`} />
        <p className="text-xs font-semibold">AI Upload</p>
      </button>

      <button
        onClick={() => setMode('manual')}
        className={`p-4 rounded-xl border-2 transition ${
          mode === 'manual'
            ? 'border-cyan-400 bg-cyan-500/20'
            : 'border-white/10 bg-[#252a41] hover:border-cyan-400/50'
        }`}
      >
        <Edit3 className={`w-6 h-6 mx-auto mb-2 ${mode === 'manual' ? 'text-cyan-400' : 'text-gray-400'}`} />
        <p className="text-xs font-semibold">Manual</p>
      </button>
    </div>
  );

  const renderVoiceMode = () => (
    <div className="text-center py-12">
      <div className="relative inline-block mb-8">
        <button
          onClick={simulateVoiceRecognition}
          disabled={isListening}
          className="relative group"
        >
          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse'
              : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:scale-105'
          }`}>
            {isListening && (
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping" />
            )}
            <Mic className="w-20 h-20 relative z-10" />
          </div>
        </button>
        {isListening && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">
        {isListening ? 'Listening...' : 'Tap to speak'}
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        Say something like "Add $45 for gas for Business Alpha"
      </p>

      {voiceTranscript && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4 animate-fade-in">
          <p className="text-sm text-cyan-400 mb-1">Transcribed:</p>
          <p className="text-white">{voiceTranscript}</p>
        </div>
      )}

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Ready to listen
      </div>
    </div>
  );

  const renderChatMode = () => (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-[#1a1d2e] rounded-xl">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-4">Start a conversation with MoneyMint Assistant</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setChatInput('Add $250 for software subscription')}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs hover:bg-blue-500/30 transition"
              >
                Add expense
              </button>
              <button
                onClick={() => setChatInput('Show my latest expenses')}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs hover:bg-purple-500/30 transition"
              >
                View expenses
              </button>
            </div>
          </div>
        )}

        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-[#252a41] border border-white/10'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400">MoneyMint AI</span>
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[#252a41] border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
          placeholder="Type your message..."
          className="flex-1 bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
        />
        <button
          onClick={handleChatSend}
          disabled={!chatInput.trim() || isProcessing}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );

  const renderOcrMode = () => (
    <div className="py-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {!uploadedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-400/50 rounded-2xl p-12 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 transition"
        >
          <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Upload Receipt</h3>
          <p className="text-gray-400 text-sm mb-4">
            Take a photo or upload an existing receipt
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition">
            Choose File
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#252a41] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-8 h-8 text-cyan-400" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
              {!isProcessing && <Check className="w-6 h-6 text-green-400" />}
              {isProcessing && <Loader className="w-6 h-6 animate-spin text-cyan-400" />}
            </div>

            {isProcessing && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <p className="text-sm text-cyan-400">AI extracting data from receipt...</p>
                </div>
              </div>
            )}

            {ocrResult && !isProcessing && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">Data extracted successfully!</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Vendor</p>
                    <p className="font-semibold">{ocrResult.vendor}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Amount</p>
                    <p className="font-semibold text-cyan-400">${ocrResult.amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="font-semibold">{ocrResult.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="font-semibold">{ocrResult.date}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setUploadedFile(null);
              setOcrResult(null);
            }}
            className="w-full py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
          >
            Upload Another Receipt
          </button>
        </div>
      )}
    </div>
  );

  const renderManualMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Business
          </label>
          <select
            value={manualForm.business}
            onChange={(e) => setManualForm({ ...manualForm, business: e.target.value })}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            Amount
          </label>
          <input
            type="number"
            value={manualForm.amount || ''}
            onChange={(e) => setManualForm({ ...manualForm, amount: parseFloat(e.target.value) })}
            placeholder="0.00"
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Vendor / Merchant</label>
        <input
          type="text"
          value={manualForm.vendor}
          onChange={(e) => setManualForm({ ...manualForm, vendor: e.target.value })}
          placeholder="e.g., Amazon, Starbucks"
          className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            Category
          </label>
          <select
            value={manualForm.category}
            onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Date
          </label>
          <input
            type="date"
            value={manualForm.date}
            onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          Payment Method
        </label>
        <select
          value={manualForm.paymentMethod}
          onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
          className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
        >
          {paymentMethods.map((pm) => (
            <option key={pm.value} value={pm.value}>{pm.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
        <textarea
          value={manualForm.notes}
          onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
          placeholder="Add any additional details..."
          rows={3}
          className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none resize-none"
        />
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyan-400 mb-1">Split this expense?</p>
            <p className="text-xs text-gray-400 mb-3">Allocate across multiple businesses</p>
            <button
              onClick={() => setSplitMode(!splitMode)}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold transition"
            >
              {splitMode ? 'Disable Split' : 'Enable Split'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveExpense}
          disabled={!manualForm.amount || !manualForm.vendor || isProcessing}
          className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Expense
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1221] rounded-3xl w-full max-w-3xl border border-cyan-400/20 shadow-2xl shadow-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Add Expense
              </h2>
              <p className="text-gray-400 text-sm">Choose your preferred entry method</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {renderModeSelector()}

          <div className="min-h-[400px]">
            {mode === 'voice' && renderVoiceMode()}
            {mode === 'chat' && renderChatMode()}
            {mode === 'ocr' && renderOcrMode()}
            {mode === 'manual' && renderManualMode()}
          </div>

          {showSuccess && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Expense Added!</h3>
                <p className="text-gray-400">Successfully saved your expense</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client'

import { useState, useRef, useEffect } from 'react';
import {
  X, Mic, MessageSquare, Camera, Edit3, Upload, Check,
  Sparkles, Calendar, DollarSign, Tag, Building2, CreditCard,
  FileText, Zap, TrendingUp, AlertCircle, Loader
} from 'lucide-react';
import VoiceExpenseRecorder from './VoiceExpenseRecorder';
import ReceiptOCRUploader from './ReceiptOCRUploader';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { getOrCreateDefaultAccount, saveExpense, validateExpense } from '../lib/expenseHelpers';

interface Business {
  id: string;
  name: string;
}

interface ExpenseEntryHubProps {
  businesses: Business[];
  onClose: () => void;
  onExpenseAdded?: (expense: any) => void;
  initialMode?: EntryMode;
  editExpense?: any; // Expense data for editing
  initialBusinessId?: string; // Selected business from context
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
  receiptUrl?: string;
  extractedBusinessName?: string; // Business name extracted from chat text
}

export default function ExpenseEntryHub({ businesses, onClose, onExpenseAdded, initialMode = 'voice', editExpense, initialBusinessId }: ExpenseEntryHubProps) {
  const { user } = useAuth();
  const { accounts } = useBusiness();
  
  const isEditMode = !!editExpense;
  
  const [mode, setMode] = useState<EntryMode>(initialMode);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI expense assistant. Just tell me about your expense and I\'ll help you categorize and save it.\n\n**Examples:**\n• "I spent $50 at Starbucks"\n• "Add $250 expense for Meta ads"\n• "Paid $25.99 for gas at Shell"\n\nWhat expense would you like to add?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<ParsedExpense | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // New state for enhanced chat interface
  const [pendingExpense, setPendingExpense] = useState<ParsedExpense | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Pre-fill form if editing
  const [manualForm, setManualForm] = useState<ParsedExpense>(() => {
    if (editExpense) {
      // Extract payment method from metadata if it exists
      const metadata = editExpense.metadata || {};
      const paymentMethod = metadata.payment_method || editExpense.payment_method || editExpense.paymentMethod || 'credit_card';
      
      return {
        amount: editExpense.amount || undefined,
        vendor: editExpense.description || editExpense.vendor || '',
        category: editExpense.category || '',
        business: editExpense.business_id || editExpense.business || businesses[0]?.id || '',
        date: editExpense.date ? new Date(editExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod,
        notes: editExpense.notes || '',
        receiptUrl: editExpense.receipt_url || editExpense.receiptUrl,
      };
    }
    return {
      amount: undefined,
      vendor: '',
      category: '',
      business: initialBusinessId || businesses[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'credit_card',
      notes: '',
    };
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

  // Handle ESC key and click-to-dismiss for success message
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSuccess) {
        setShowSuccess(false);
        onClose();
      }
    };

    if (showSuccess) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuccess, onClose]);

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
    // Enhanced vendor extraction with common business patterns
    const commonVendors = [
      'shell', 'chevron', 'amazon', 'starbucks', 'uber', 'lyft', 'meta', 'facebook', 'google',
      'microsoft', 'apple', 'netflix', 'spotify', 'adobe', 'salesforce', 'shopify', 'square',
      'paypal', 'stripe', 'twilio', 'sendgrid', 'mailchimp', 'hubspot', 'slack', 'zoom',
      'office depot', 'staples', 'walmart', 'target', 'costco', 'home depot', 'lowes',
      'mcdonalds', 'burger king', 'subway', 'pizza hut', 'dominos', 'chipotle', 'panera',
      'hilton', 'marriott', 'airbnb', 'booking', 'expedia', 'delta', 'united', 'american',
      'verizon', 'att', 'tmobile', 'sprint', 'comcast', 'spectrum', 'cox'
    ];
    
    const textLower = text.toLowerCase();
    const found = commonVendors.find(v => textLower.includes(v));
    
    if (found) {
      return found.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // Try to extract vendor from common patterns
    const vendorPatterns = [
      /(?:at|from|to|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:spent|paid|bought)\s+.*?\s+(?:at|from|to|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:expense|purchase|transaction)\s+.*?\s+(?:at|from|to|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return '';
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsProcessing(true);

    setTimeout(() => {
      const parsed = parseChatMessage(userMessage);
      
      // Handle business name extraction
      if (parsed.extractedBusinessName && !parsed.business) {
        // Business mentioned but not found
        const businessNameStr = String(parsed.extractedBusinessName || '');
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `I found a business name "${businessNameStr}" in your message, but I couldn't find it in your business list.\n\nWould you like to:\n1. Create a new business "${businessNameStr}"?\n2. Select from an existing business?\n3. Continue with the currently selected business?`
        }]);
        setIsProcessing(false);
        return;
      }
      
      // Validate required fields
      const missing: string[] = [];
      if (!parsed.amount) missing.push('amount');
      if (!parsed.vendor) missing.push('vendor');
      if (!parsed.category) missing.push('category');
      if (!parsed.business) {
        // Use initialBusinessId if available, otherwise ask
        if (initialBusinessId) {
          parsed.business = initialBusinessId;
        } else {
          missing.push('business name');
        }
      }
      
      if (missing.length > 0) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `I need more information: ${missing.join(', ')}. Please provide these details.`
        }]);
        setIsProcessing(false);
        return;
      }
      
      // Store pending expense and show confirmation
      setPendingExpense(parsed);
      setShowConfirmation(true);
      
      // Get business name for display
      const businessName = parsed.business ? (businesses.find(b => b.id === String(parsed.business))?.name || 'Unknown Business') : 'Unknown Business';
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Perfect!\n💰 Amount: $${parsed.amount || 0}\n🏢 Vendor: ${parsed.vendor || 'N/A'}\n📅 Date: ${parsed.date || 'N/A'}\n📂 Category: ${parsed.category || 'N/A'}\n🏢 Business: ${businessName}\n\nDoes this look correct?`
      }]);
      
      setIsProcessing(false);
    }, 1000);
  };

  const parseChatMessage = (text: string): ParsedExpense => {
    const amountMatch = text.match(/\$?(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    const vendor = extractVendor(text);
    
    // Extract business name from text patterns like:
    // "for XYZ inc", "for Business ABC", "for XYZ LLC", "for XYZ Corporation"
    const extractBusinessName = (text: string): string | null => {
      const businessPatterns = [
        /for\s+([A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.?))(?:\s|$)/i,
        /for\s+(Business\s+[A-Z][a-zA-Z\s]+)/i,
        /for\s+([A-Z][a-zA-Z\s]{2,}(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.?))?)(?:\s|$)/i,
      ];
      
      for (const pattern of businessPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const businessName = match[1].trim();
          // Don't match if it's just a vendor name (too short or common words)
          if (businessName.length > 3 && !['Meta', 'Google', 'Amazon', 'Apple'].includes(businessName.split(' ')[0])) {
            return businessName;
          }
        }
      }
      
      return null;
    };
    
    const extractedBusinessName = extractBusinessName(text);
    let matchedBusinessId = initialBusinessId || businesses[0]?.id || '';
    
    if (extractedBusinessName) {
      // Try to find matching business (case-insensitive, partial match)
      const matchedBusiness = businesses.find(b => 
        b.name.toLowerCase().includes(extractedBusinessName.toLowerCase()) ||
        extractedBusinessName.toLowerCase().includes(b.name.toLowerCase())
      );
      
      if (matchedBusiness) {
        matchedBusinessId = matchedBusiness.id;
      } else {
        // Business not found - will be handled in handleChatSend
        matchedBusinessId = ''; // Signal that business needs to be created/confirmed
      }
    }
    
    // Smart categorization based on vendor and keywords
    const categorizeExpense = (vendor: string, text: string): string => {
      const textLower = text.toLowerCase();
      const vendorLower = vendor.toLowerCase();
      
      // Marketing & Advertising
      if (vendorLower.includes('meta') || vendorLower.includes('facebook') || vendorLower.includes('google') || 
          vendorLower.includes('adobe') || textLower.includes('advertising') || textLower.includes('marketing') ||
          textLower.includes('campaign') || textLower.includes('ads')) {
        return 'Marketing & Advertising';
      }
      
      // Travel & Meals
      if (vendorLower.includes('uber') || vendorLower.includes('lyft') || vendorLower.includes('delta') ||
          vendorLower.includes('united') || vendorLower.includes('american') || vendorLower.includes('hilton') ||
          vendorLower.includes('marriott') || vendorLower.includes('airbnb') || vendorLower.includes('booking') ||
          vendorLower.includes('starbucks') || vendorLower.includes('mcdonalds') || vendorLower.includes('subway') ||
          textLower.includes('travel') || textLower.includes('flight') || textLower.includes('hotel') ||
          textLower.includes('meal') || textLower.includes('lunch') || textLower.includes('dinner')) {
        return 'Travel & Meals';
      }
      
      // Software & Technology
      if (vendorLower.includes('microsoft') || vendorLower.includes('apple') || vendorLower.includes('netflix') ||
          vendorLower.includes('spotify') || vendorLower.includes('salesforce') || vendorLower.includes('shopify') ||
          vendorLower.includes('slack') || vendorLower.includes('zoom') || vendorLower.includes('twilio') ||
          vendorLower.includes('sendgrid') || vendorLower.includes('mailchimp') || vendorLower.includes('hubspot') ||
          textLower.includes('software') || textLower.includes('subscription') || textLower.includes('saas')) {
        return 'Software & Technology';
      }
      
      // Office & Admin
      if (vendorLower.includes('office depot') || vendorLower.includes('staples') || vendorLower.includes('walmart') ||
          vendorLower.includes('target') || vendorLower.includes('costco') || vendorLower.includes('home depot') ||
          vendorLower.includes('lowes') || textLower.includes('office') || textLower.includes('supplies') ||
          textLower.includes('stationery') || textLower.includes('paper') || textLower.includes('pens')) {
        return 'Office & Admin';
      }
      
      // Utilities
      if (vendorLower.includes('verizon') || vendorLower.includes('att') || vendorLower.includes('tmobile') ||
          vendorLower.includes('sprint') || vendorLower.includes('comcast') || vendorLower.includes('spectrum') ||
          vendorLower.includes('cox') || textLower.includes('electric') || textLower.includes('gas') ||
          textLower.includes('water') || textLower.includes('internet') || textLower.includes('phone')) {
        return 'Utilities';
      }
      
      // Professional Services
      if (textLower.includes('consulting') || textLower.includes('legal') || textLower.includes('accounting') ||
          textLower.includes('lawyer') || textLower.includes('attorney') || textLower.includes('cpa') ||
          textLower.includes('bookkeeping') || textLower.includes('audit')) {
        return 'Professional Services';
      }
      
      // Equipment
      if (textLower.includes('computer') || textLower.includes('laptop') || textLower.includes('desktop') ||
          textLower.includes('monitor') || textLower.includes('keyboard') || textLower.includes('mouse') ||
          textLower.includes('printer') || textLower.includes('scanner') || textLower.includes('equipment')) {
        return 'Equipment';
      }
      
      return 'Other';
    };

    return {
      amount,
      vendor,
      category: categorizeExpense(vendor, text),
      date: new Date().toISOString().split('T')[0],
      business: matchedBusinessId,
      paymentMethod: 'credit_card',
      notes: `Added via chat: "${text}"`,
      extractedBusinessName: extractedBusinessName || undefined,
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      setManualForm({ ...manualForm, receiptUrl: publicUrl });
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      alert(`Failed to upload receipt: ${error.message || 'Unknown error'}. Please ensure:\n- File is an image\n- File size is under 10MB\n- You have an active internet connection`);
    }
  };

  const handleSaveExpense = async (payload?: ParsedExpense) => {
    setIsProcessing(true);
    try {
      if (!user) throw new Error('No user logged in');
      const exp = payload ?? manualForm;
      
      // Get business name and append to description if not already included
      const businessName = exp.business ? (businesses.find(b => b.id === String(exp.business))?.name || '') : '';
      let description = exp.vendor || '';
      
      // Only append business name if it's not already in the description
      // This prevents duplication if user manually includes it
      // Check if business name is already in description (case-insensitive)
      if (businessName && !description.toLowerCase().includes(businessName.toLowerCase())) {
        description = `${description} for ${businessName}`;
      }
      
      const invalid = validateExpense({
        amount: exp.amount,
        description: description,
        category: exp.category,
        business: exp.business,
        date: exp.date,
      });
      if (invalid.length) throw new Error(`Missing or invalid: ${invalid.join(', ')}`);

      // If editing, update existing transaction
      if (isEditMode && editExpense?.id) {
        // Get existing metadata or create new
        const existingMetadata = (editExpense.metadata && typeof editExpense.metadata === 'object') 
          ? editExpense.metadata 
          : {};
        
        const updateData: any = {
          amount: exp.amount!,
          description: description,
          category: exp.category!,
          date: exp.date || new Date().toISOString().split('T')[0],
          receipt_url: (exp as any).receiptUrl || editExpense.receipt_url || null,
          notes: exp.notes || null,
          // Store payment method in metadata JSONB (not as a column)
          metadata: {
            ...existingMetadata,
            payment_method: exp.paymentMethod || null,
          },
        };
        
        const { error } = await (supabase
          .from('transactions') as any)
          .update(updateData)
          .eq('id', editExpense.id);

        if (error) throw error;

        // Handle expense approval - check if approval entry exists
        const { data: existingApproval } = await supabase
          .from('expense_approvals')
          .select('id')
          .eq('transaction_id', editExpense.id)
          .single();

        if (existingApproval && (existingApproval as any).id) {
          // Update existing approval to pending
          const approvalUpdateData: any = { 
            status: 'pending',
            updated_at: new Date().toISOString(),
          };
          await (supabase
            .from('expense_approvals') as any)
            .update(approvalUpdateData)
            .eq('id', (existingApproval as any).id);
        } else {
          // Create new approval entry for edited expense
          await supabase
            .from('expense_approvals')
            .insert({
              business_id: exp.business!,
              transaction_id: editExpense.id,
              submitter_id: user.id,
              status: 'pending',
            } as any);
        }

        // Fetch updated transaction
        const { data: updatedTransaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', editExpense.id)
          .single();

        if (fetchError) throw fetchError;

        onExpenseAdded?.(updatedTransaction);
        setShowSuccess(true);
        return;
      }

      // Ensure an active account exists for the selected business
      const defaultAccount = await getOrCreateDefaultAccount(supabase, exp.business!);

      // Save expense via shared helper (new expense)
      // Use description with business name appended (already processed above)
      const transaction = await saveExpense({
        supabase,
        userId: user.id,
        businessId: exp.business!,
        accountId: defaultAccount.id,
        expense: {
          amount: exp.amount!,
          description: description,
          category: exp.category!,
          date: exp.date || new Date().toISOString().split('T')[0],
          receiptUrl: (exp as any).receiptUrl || null,
          notes: exp.notes || null,
          paymentMethod: exp.paymentMethod || null,
          aiCategory: exp.category!,
          aiConfidence: 0.95,
        },
      });

      onExpenseAdded?.(transaction);
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Error saving expense:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      alert(`Failed to save expense: ${errorMsg}. Please check:\n- Business is selected\n- Account exists for business\n- All required fields are filled`);
    } finally {
      setIsProcessing(false);
    }
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

  const handleExpenseExtracted = (expense: any) => {
    setManualForm({ ...manualForm, ...expense });
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const renderVoiceMode = () => (
    <VoiceExpenseRecorder
      onExpenseExtracted={handleExpenseExtracted}
      businessId={businesses[0]?.id}
      className="w-full"
    />
  );

  const renderChatMode = () => (
    <div className="flex flex-col h-[500px]">
      {/* Add Cancel Button at top of chat area */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-gray-300">Chat with AI Assistant</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-[#252a41] hover:bg-[#2d3248] rounded-lg flex items-center justify-center transition"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-[#1a1d2e] rounded-xl">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-4">Start a conversation with ExpenseIQ</p>
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
                  <span className="text-xs font-semibold text-cyan-400">ExpenseIQ</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{String(msg.content || '')}</p>
            </div>
          </div>
        ))}

        {/* Confirmation buttons */}
        {showConfirmation && pendingExpense && (
          <div className="space-y-3 mt-4">
            {/* Display Business Name Card */}
            <div className="bg-[#1a1d2e] border border-cyan-400/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-gray-300">Business:</span>
                <span className="text-sm text-cyan-400 font-bold">
                  {pendingExpense.business ? (businesses.find(b => b.id === String(pendingExpense.business))?.name || 'Unknown Business') : 'Unknown Business'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (pendingExpense) {
                    handleSaveExpense(pendingExpense);
                    setShowConfirmation(false);
                    setPendingExpense(null);
                  }
                }}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition"
              >
                ✅ Yes, Save
              </button>
              <button 
                onClick={() => {
                  setShowConfirmation(false);
                  setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'No problem! What would you like to change?'
                  }]);
                }}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition"
              >
                ❌ No, Edit
              </button>
            </div>
          </div>
        )}

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
          onClick={onClose}
          className="px-4 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition flex items-center justify-center"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
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
    <ReceiptOCRUploader
      onExpenseExtracted={handleExpenseExtracted}
      businessId={businesses[0]?.id}
      className="w-full"
    />
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

      <div>
        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Receipt (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleReceiptUpload}
          className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 transition"
        />
        {manualForm.receiptUrl && (
          <p className="text-xs text-green-400 mt-2">✓ Receipt uploaded successfully</p>
        )}
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
          onClick={() => handleSaveExpense()}
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1221] rounded-3xl w-full max-w-3xl border border-cyan-400/20 shadow-2xl shadow-cyan-500/20 relative overflow-visible my-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6 relative z-20 sticky top-0 bg-gradient-to-br from-[#1a1d2e] to-[#0f1221] pb-4 border-b border-white/10 -mx-8 px-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {isEditMode ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <p className="text-gray-400 text-sm">{isEditMode ? 'Update expense details' : 'Choose your preferred entry method'}</p>
              {/* Display Business Name if available */}
              {!isEditMode && initialBusinessId && (
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400 font-semibold">
                    {initialBusinessId ? (businesses.find(b => b.id === String(initialBusinessId))?.name || 'Selected Business') : 'Selected Business'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition z-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isEditMode && renderModeSelector()}

          <div className="min-h-[400px]">
            {mode === 'voice' && renderVoiceMode()}
            {mode === 'chat' && renderChatMode()}
            {mode === 'ocr' && renderOcrMode()}
            {mode === 'manual' && renderManualMode()}
          </div>

          {showSuccess && (
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center cursor-pointer"
              onClick={() => {
                setShowSuccess(false);
                onClose();
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Expense Added!</h3>
                <p className="text-gray-400 mb-4">Successfully saved your expense</p>
                <p className="text-xs text-gray-500">Press ESC or click anywhere to close</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client'

import { useState, useCallback } from 'react'
import { Upload, Camera, FileImage, Check, X, Loader, AlertCircle } from 'lucide-react'
import { useAIAssistant } from '../hooks/useAIAssistant'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { getOrCreateDefaultAccount, saveExpense } from '../lib/expenseHelpers'

interface ReceiptOCRUploaderProps {
  onExpenseExtracted?: (expense: any) => void
  businessId?: string
  className?: string
  onError?: (error: Error, expenseData: any) => void
}

export default function ReceiptOCRUploader({ 
  onExpenseExtracted, 
  businessId,
  className = '',
  onError
}: ReceiptOCRUploaderProps) {
  const { user } = useAuth()
  const { accounts } = useBusiness()
  
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractedExpense, setExtractedExpense] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal')

  const { 
    isProcessing, 
    error, 
    processReceipt, 
    clearError 
  } = useAIAssistant()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      // Use a simple alert for now since setError is not available
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    clearError()
  }, [clearError])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [handleFile])

  const processReceiptOCR = useCallback(async () => {
    if (!selectedFile) return

    try {
      const result = await processReceipt(selectedFile)
      setExtractedExpense(result.expense)
      setShowConfirmation(true)
    } catch (err) {
      console.error('Error processing receipt:', err)
    }
  }, [selectedFile, processReceipt])

  const clearFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setExtractedExpense(null)
    setShowConfirmation(false)
    clearError()
  }, [previewUrl, clearError])

  const confirmExpense = useCallback(async () => {
    if (!extractedExpense || !user || !businessId) return;
    
    try {
      // Ensure account exists, create one if needed
      const defaultAccount = await getOrCreateDefaultAccount(supabase, businessId);

      // Save expense via helper (priority is stored in metadata by saveExpense)
      const transaction = await saveExpense({
        supabase,
        userId: user.id,
        businessId,
        accountId: defaultAccount.id,
        expense: {
          amount: extractedExpense.amount,
          description: extractedExpense.vendor || extractedExpense.description,
          category: extractedExpense.category,
          date: extractedExpense.date || new Date().toISOString().split('T')[0],
          receiptUrl: previewUrl || null,
          aiCategory: extractedExpense.category,
          aiConfidence: extractedExpense.confidence || 0.95,
          priority: priority, // Priority will be stored in metadata by saveExpense
        },
      });

    onExpenseExtracted?.(transaction);
    clearFile();
  } catch (error) {
    console.error('Error saving OCR expense:', error);
    // Transfer to manual entry on error
    if (onError) {
      const expenseData = {
        amount: extractedExpense.amount,
        vendor: extractedExpense.vendor || extractedExpense.description,
        category: extractedExpense.category,
        business: businessId,
        date: extractedExpense.date || new Date().toISOString().split('T')[0],
        paymentMethod: 'credit_card',
        notes: extractedExpense.description,
        receiptUrl: previewUrl || undefined,
        priority: priority
      };
      onError(error instanceof Error ? error : new Error('Failed to save expense'), expenseData);
    } else {
      alert('Failed to save expense. Please try again.');
    }
  }
}, [extractedExpense, user, businessId, accounts, onExpenseExtracted, previewUrl, clearFile, priority, onError])

  const rejectExpense = useCallback(() => {
    setShowConfirmation(false)
    setExtractedExpense(null)
  }, [])

  

  return (
    <div className={`bg-[#1a2332] rounded-2xl p-6 border border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#EC4899] to-[#DB2777] rounded-xl flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Receipt OCR</h3>
          <p className="text-sm text-gray-400">Upload or capture receipt image</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm font-medium">OCR processing failed</p>
          </div>
          <p className="text-red-300 text-xs mb-3">{error}</p>
          <div className="flex gap-2">
            <button 
              onClick={clearError}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
            {selectedFile && (
              <button 
                onClick={processReceiptOCR}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#EC4899] to-[#DB2777] rounded-2xl flex items-center justify-center">
              <FileImage className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <p className="text-white font-medium mb-1">Drop receipt image here</p>
              <p className="text-gray-400 text-sm">or click to browse</p>
            </div>

            <div className="flex gap-2">
              <label className="bg-gradient-to-r from-[#4F7CFF] to-[#7B5CFF] hover:from-[#3B5BFF] hover:to-[#6B4CFF] text-white px-4 py-2 rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4 inline mr-2" />
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
              
              <button className="bg-[#1a2332] border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-[#252a41] transition">
                <Camera className="w-4 h-4 inline mr-2" />
                Camera
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Supports JPG, PNG, WebP up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={previewUrl || undefined}
              alt="Receipt preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Info */}
          <div className="p-3 bg-[#0f1729] rounded-lg">
            <p className="text-sm text-gray-300 mb-1">Selected file:</p>
            <p className="text-white text-sm">{selectedFile.name}</p>
            <p className="text-gray-400 text-xs">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Extracted Expense */}
          {extractedExpense && showConfirmation && (
            <div className="p-3 bg-[#0f1729] rounded-lg border border-green-500/20">
              <p className="text-sm text-gray-300 mb-2">Extracted Expense:</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Amount:</span> ${extractedExpense.amount}</p>
                <p><span className="text-gray-400">Description:</span> {extractedExpense.description}</p>
                <p><span className="text-gray-400">Category:</span> {extractedExpense.category}</p>
                {extractedExpense.vendor && (
                  <p><span className="text-gray-400">Vendor:</span> {extractedExpense.vendor}</p>
                )}
                <p><span className="text-gray-400">Confidence:</span> {Math.round(extractedExpense.confidence * 100)}%</p>
              </div>
              
              {/* Priority Selector */}
              <div className="mb-3 mt-3">
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-cyan-400" />
                  Priority (Optional)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'normal' | 'low')}
                  className="w-full bg-[#0f1729] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={confirmExpense}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
                <button
                  onClick={rejectExpense}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Process Button */}
          {!showConfirmation && (
            <button
              onClick={processReceiptOCR}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-[#EC4899] to-[#DB2777] hover:from-[#DB2777] hover:to-[#BE185D] text-white px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  Extract Expense Data
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}




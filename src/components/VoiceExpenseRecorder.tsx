'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Square, Play, Pause, Trash2, Check, X } from 'lucide-react'
import { useAIAssistant } from '../hooks/useAIAssistant'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

interface VoiceExpenseRecorderProps {
  onExpenseExtracted?: (expense: any) => void
  businessId?: string
  className?: string
}

export default function VoiceExpenseRecorder({ 
  onExpenseExtracted, 
  businessId,
  className = '' 
}: VoiceExpenseRecorderProps) {
  const { user } = useAuth()
  const { accounts } = useBusiness()
  
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [extractedExpense, setExtractedExpense] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Banking-style conversation flow states
  const [recordingState, setRecordingState] = useState<'idle' | 'listening' | 'processing' | 'confirming'>('idle')
  const [conversationStep, setConversationStep] = useState<'amount' | 'vendor' | 'category' | 'confirm'>('amount')
  const [voiceFeedback, setVoiceFeedback] = useState<string>('')
  const [collectedData, setCollectedData] = useState<{
    amount?: string
    vendor?: string
    category?: string
  }>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const { 
    isProcessing, 
    error, 
    transcribeAudio, 
    extractExpense, 
    clearError 
  } = useAIAssistant()

  // Banking-style prompts
  const getPromptForStep = (step: string) => {
    switch (step) {
      case 'amount':
        return 'Please state the expense amount. For example, say "fifty dollars" or "twenty five dollars and fifty cents".'
      case 'vendor':
        return 'What vendor or merchant was this expense for? For example, say "Starbucks" or "Amazon".'
      case 'category':
        return 'What category does this expense belong to? You can say "food", "travel", "office supplies", "marketing", or "other".'
      case 'confirm':
        return `Please confirm: ${collectedData.amount} at ${collectedData.vendor} for ${collectedData.category}. Is this correct?`
      default:
        return 'I\'m ready to help you add an expense. Let\'s start with the amount.'
    }
  }

  const processConversationStep = async (transcribedText: string) => {
    setRecordingState('processing')
    
    try {
      // Extract relevant information based on current step
      const extractedData = await extractExpense(transcribedText, businessId)
      
      switch (conversationStep) {
        case 'amount':
          const amountMatch = transcribedText.match(/(\d+(?:\.\d{2})?)/)
          if (amountMatch) {
            setCollectedData(prev => ({ ...prev, amount: amountMatch[1] }))
            setConversationStep('vendor')
            setVoiceFeedback(`Got it, ${amountMatch[1]} dollars.`)
          } else {
            setVoiceFeedback('I didn\'t catch the amount. Please try again.')
          }
          break
          
        case 'vendor':
          setCollectedData(prev => ({ ...prev, vendor: transcribedText }))
          setConversationStep('category')
          setVoiceFeedback(`Thank you, ${transcribedText}.`)
          break
          
        case 'category':
          setCollectedData(prev => ({ ...prev, category: transcribedText }))
          setConversationStep('confirm')
          setVoiceFeedback('Perfect! Let me confirm the details.')
          break
          
        case 'confirm':
          if (transcribedText.toLowerCase().includes('yes') || transcribedText.toLowerCase().includes('correct')) {
            // Create final expense object
            const finalExpense = {
              amount: parseFloat(collectedData.amount || '0'),
              vendor: collectedData.vendor,
              category: collectedData.category,
              description: `${collectedData.amount} expense at ${collectedData.vendor}`,
              confidence: 0.95
            }
            setExtractedExpense(finalExpense)
            setShowConfirmation(true)
            setRecordingState('confirming')
          } else {
            setConversationStep('amount')
            setCollectedData({})
            setVoiceFeedback('Let\'s start over. Please state the expense amount.')
          }
          break
      }
    } catch (error) {
      console.error('Error processing conversation step:', error)
      setVoiceFeedback('I\'m sorry, I didn\'t understand that. Please try again.')
    }
    
    setRecordingState('idle')
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setIsPaused(false)
      setRecordingState('listening')
      clearError()

    } catch (err) {
      console.error('Error starting recording:', err)
      alert('Failed to access microphone. Please check permissions.')
    }
  }, [clearError])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setRecordingState('idle')
    }
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [isRecording, isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [isRecording, isPaused])

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscription(null)
    setExtractedExpense(null)
    setShowConfirmation(false)
    setRecordingState('idle')
    setConversationStep('amount')
    setCollectedData({})
    setVoiceFeedback('')
    clearError()
  }, [audioUrl, clearError])

  const resetConversation = useCallback(() => {
    setConversationStep('amount')
    setCollectedData({})
    setVoiceFeedback('')
    setRecordingState('idle')
  }, [])

  const processRecording = useCallback(async () => {
    if (!audioBlob) return

    try {
      setRecordingState('processing')
      
      // Step 1: Transcribe audio
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      const transcriptionResult = await transcribeAudio(audioFile)
      setTranscription(transcriptionResult.text)

      // Step 2: Process conversation step
      await processConversationStep(transcriptionResult.text)

    } catch (err) {
      console.error('Error processing recording:', err)
      setVoiceFeedback('I\'m sorry, there was an error processing your request. Please try again.')
      setRecordingState('idle')
    }
  }, [audioBlob, transcribeAudio, processConversationStep])

  const confirmExpense = useCallback(async () => {
    if (!extractedExpense || !user || !businessId) return;
    
    try {
      // Get default account for business
      const defaultAccount = accounts.find(acc => 
        acc.business_id === businessId && acc.is_active
      );
      
      if (!defaultAccount) throw new Error('No active account found');

      // 1. Save transaction
      const { data: transaction, error: transactionError } = await (supabase as any)
        .from('transactions')
        .insert({
          business_id: businessId,
          account_id: defaultAccount.id,
          user_id: user.id,
          transaction_type: 'expense',
          amount: extractedExpense.amount,
          description: extractedExpense.vendor,
          category: extractedExpense.category,
          date: new Date().toISOString().split('T')[0],
          ai_category: extractedExpense.category,
          ai_confidence: extractedExpense.confidence || 0.95
        } as Database['public']['Tables']['transactions']['Insert'])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Create approval record
      const { error: approvalError } = await (supabase as any)
        .from('expense_approvals')
        .insert({
          business_id: businessId,
          transaction_id: transaction!.id,
          submitter_id: user.id,
          status: 'pending'
        } as Database['public']['Tables']['expense_approvals']['Insert']);

      if (approvalError) throw approvalError;

      onExpenseExtracted?.(transaction);
      clearRecording();
    } catch (error) {
      console.error('Error saving voice expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  }, [extractedExpense, user, businessId, accounts, onExpenseExtracted, clearRecording])

  const rejectExpense = useCallback(() => {
    setShowConfirmation(false)
    setExtractedExpense(null)
  }, [])

  return (
    <div className={`bg-[#1a2332] rounded-2xl p-6 border border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#4F7CFF] to-[#7B5CFF] rounded-xl flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Voice Expense</h3>
          <p className="text-sm text-gray-400">Speak your expense details</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!audioBlob ? (
        <div className="space-y-4">
          {/* Banking-style conversation flow */}
          <div className="bg-[#252a41] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                recordingState === 'listening' ? 'bg-green-500 animate-pulse' : 
                recordingState === 'processing' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-500'
              }`} />
              <p className="text-sm font-medium text-gray-300">
                {recordingState === 'listening' ? 'Listening...' :
                 recordingState === 'processing' ? 'Processing...' :
                 recordingState === 'confirming' ? 'Confirming...' :
                 'Ready to help'}
              </p>
            </div>
            
            <div className="text-sm text-gray-400 mb-3">
              <p className="font-medium mb-2">Current step: {conversationStep}</p>
              <p>{getPromptForStep(conversationStep)}</p>
            </div>
            
            {voiceFeedback && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-sm">{voiceFeedback}</p>
              </div>
            )}
            
            {Object.keys(collectedData).length > 0 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-xs font-medium mb-2">Collected Information:</p>
                <div className="space-y-1 text-xs text-gray-300">
                  {collectedData.amount && <p>Amount: ${collectedData.amount}</p>}
                  {collectedData.vendor && <p>Vendor: {collectedData.vendor}</p>}
                  {collectedData.category && <p>Category: {collectedData.category}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857]'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <p className="mt-3 text-gray-400 text-sm">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>

          {isRecording && (
            <div className="flex justify-center gap-2">
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="px-4 py-2 bg-[#1a2332] border border-white/10 rounded-lg text-white hover:bg-[#252a41] transition"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
          )}

          {/* Reset conversation button */}
          {Object.keys(collectedData).length > 0 && !isRecording && (
            <div className="flex justify-center">
              <button
                onClick={resetConversation}
                className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Start Over
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audio Playback */}
          <div className="flex items-center gap-3">
            <audio 
              controls 
              src={audioUrl || undefined}
              className="flex-1"
            />
            <button
              onClick={clearRecording}
              className="p-2 text-gray-400 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Transcription */}
          {transcription && (
            <div className="p-3 bg-[#0f1729] rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Transcription:</p>
              <p className="text-white">{transcription}</p>
            </div>
          )}

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
              onClick={processRecording}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-[#4F7CFF] to-[#7B5CFF] hover:from-[#3B5BFF] hover:to-[#6B4CFF] text-white px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process Recording'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}




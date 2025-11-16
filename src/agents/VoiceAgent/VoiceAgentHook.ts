/**
 * useVoiceAgent Hook
 * 
 * Enhanced voice agent hook with:
 * - Progress tracking
 * - Completion guarantee
 * - Smart follow-up questions
 * - Status question handling
 * - VAD integration
 * - Token optimization
 * 
 * @hook useVoiceAgent
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { VoiceStreamingService, StreamingCallbacks } from '../../services/VoiceStreamingService'
import { ConversationManager, ConversationMessage } from '../../services/ConversationManager'
import { PersonalityEngine, PersonalityType } from '../../services/PersonalityEngine'
import { ExpenseDraftManager } from '../../services/ExpenseDraftManager'
import { progressTracker, ProgressState } from '../../services/ProgressTracker'
import { conversationStateManager } from '../../services/ConversationStateManager'
import { completionGuarantee } from '../../services/CompletionGuarantee'
import { voiceErrorHandler } from '../../services/errors/VoiceErrorHandler'
import { VoiceActivityDetector, defaultVADConfig } from './VoiceActivityDetector'
import { expenseCapability } from '../../capabilities/ExpenseCapability'
import { recognizeIntent } from '../../lib/voiceAgentUtils'
import type { ExpenseDraft } from '../../services/interfaces/IExpenseDraftManager'
import { saveExpense, getOrCreateDefaultAccount } from '../../lib/expenseHelpers'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export interface VoiceAgentState {
  isActive: boolean
  state: 'idle' | 'listening' | 'processing' | 'speaking' | 'asking' | 'completing' | 'awaiting_confirmation'
  currentTranscript: string
  conversationHistory: ConversationMessage[]
  error: string | null
  progress: ProgressState | null
  draft: ExpenseDraft | null
  completionStatus: {
    isComplete: boolean
    missingFields: string[]
    hasBeenSaved: boolean
    completionPercentage: number
  } | null
  awaitingConfirmation?: boolean
  retryCount?: number
  maxRetries?: number
}

export interface VoiceAgentConfig {
  personality?: PersonalityType
  websocketUrl?: string
  autoStart?: boolean
  onExpenseExtracted?: (expense: any) => void
  businessId?: string
  businesses?: Array<{ id: string; name: string }>
  maxRetries?: number
  onOpenManualEntry?: (draft: ExpenseDraft) => void
}

/**
 * Resolve business ID from draft business field
 * Handles both UUID format and business name matching
 * @param draftBusiness - Business value from draft (can be UUID or name)
 * @param businesses - Array of available businesses
 * @param fallbackBusinessId - Fallback business ID from config
 * @returns Resolved business ID or null
 */
function resolveBusinessId(
  draftBusiness: string | null | undefined,
  businesses: Array<{ id: string; name: string }>,
  fallbackBusinessId?: string
): string | null {
  if (!draftBusiness) {
    return fallbackBusinessId || null
  }

  // Check if it's already a UUID (business ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draftBusiness)
  
  if (isUUID) {
    // Verify it exists in businesses list
    const exists = businesses.some(b => b.id === draftBusiness)
    return exists ? draftBusiness : (fallbackBusinessId || null)
  }

  // It's a business name - find matching business (case-insensitive, partial match)
  const matchedBusiness = businesses.find(b => 
    b.name.toLowerCase() === draftBusiness.toLowerCase() ||
    b.name.toLowerCase().includes(draftBusiness.toLowerCase()) ||
    draftBusiness.toLowerCase().includes(b.name.toLowerCase())
  )

  return matchedBusiness ? matchedBusiness.id : (fallbackBusinessId || null)
}

export function useVoiceAgent(config: VoiceAgentConfig = {}) {
  const { onExpenseExtracted, businessId, businesses = [], maxRetries = 3, onOpenManualEntry } = config
  const { user } = useAuth()

  const [agentState, setAgentState] = useState<VoiceAgentState>({
    isActive: false,
    state: 'idle',
    currentTranscript: '',
    conversationHistory: [],
    error: null,
    progress: null,
    draft: null,
    completionStatus: null,
    retryCount: 0,
    maxRetries: maxRetries
  })

  // Service refs
  const streamingServiceRef = useRef<VoiceStreamingService | null>(null)
  const conversationManagerRef = useRef<ConversationManager | null>(null)
  const personalityEngineRef = useRef<PersonalityEngine | null>(null)
  const draftManagerRef = useRef<ExpenseDraftManager | null>(null)
  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const handleUserMessageRef = useRef<((text: string) => Promise<void>) | null>(null)
  const conversationActiveRef = useRef<boolean>(false) // Track if conversation loop is active
  const greetingSpokenRef = useRef<boolean>(false) // Track if greeting has been spoken

  // Initialize services
  useEffect(() => {
    conversationManagerRef.current = new ConversationManager()
    personalityEngineRef.current = new PersonalityEngine(config.personality || 'friendly')
    draftManagerRef.current = new ExpenseDraftManager()

    // Initialize VAD
    vadRef.current = new VoiceActivityDetector(defaultVADConfig)
    vadRef.current.initialize().catch(error => {
      console.error('VAD initialization failed:', error)
    })

    // Set up completion guarantee save callback
    // FIXED: Actually saves expense to database using saveExpense helper
    completionGuarantee.setSaveCallback(async (expense: ExpenseDraft) => {
      try {
        if (!user) {
          console.error('Missing user for saving expense')
          return false
        }

        // Validate required fields
        if (!expense.amount || !expense.category || !expense.vendor) {
          console.error('Missing required expense fields:', { 
            amount: expense.amount, 
            category: expense.category, 
            vendor: expense.vendor 
          })
          return false
        }

        // Resolve business ID from draft
        const targetBusinessId = resolveBusinessId(
          expense.business,
          businesses,
          businessId
        )

        if (!targetBusinessId) {
          console.error('Could not resolve business ID. Draft business:', expense.business, 'Available businesses:', businesses.map(b => b.name))
          return false
        }

        // Get or create default account for business
        const defaultAccount = await getOrCreateDefaultAccount(supabase, targetBusinessId)

        // Save expense using helper function (creates transaction + approval record)
        const transaction = await saveExpense({
          supabase,
          userId: user.id,
          businessId: targetBusinessId, // Use resolved businessId
          accountId: defaultAccount.id,
          expense: {
            amount: expense.amount,
            description: expense.vendor || expense.description || 'Expense',
            category: expense.category,
            date: expense.date || new Date().toISOString().split('T')[0],
            receiptUrl: expense.receipt_url || null,
            notes: expense.description || null,
            paymentMethod: expense.payment_method || null,
            aiCategory: expense.category,
            aiConfidence: 0.95,
            priority: expense.priority || 'normal', // Use draft priority or default to normal
          },
        })

        // Transaction was successfully saved - return true even if callback fails
        // Wrap callback in try-catch to prevent false negatives
        if (onExpenseExtracted) {
          try {
            onExpenseExtracted(transaction)
          } catch (callbackError) {
            // Log callback error but don't fail the save
            console.warn('Callback error (expense was saved successfully):', callbackError)
          }
        }

        return true
      } catch (error) {
        console.error('Error saving expense:', error)
        return false
      }
    })

    // Set up draft manager save callback
    // FIXED: Actually saves expense to database using saveExpense helper
    draftManagerRef.current.setSaveCallback(async () => {
      const draft = draftManagerRef.current!.getDraft()
      try {
        if (!user) {
          console.error('Missing user for saving expense')
          return false
        }

        // Validate required fields
        if (!draft.amount || !draft.category || !draft.vendor) {
          console.error('Missing required expense fields:', { 
            amount: draft.amount, 
            category: draft.category, 
            vendor: draft.vendor 
          })
          return false
        }

        // Resolve business ID from draft
        const targetBusinessId = resolveBusinessId(
          draft.business,
          businesses,
          businessId
        )

        if (!targetBusinessId) {
          console.error('Could not resolve business ID. Draft business:', draft.business, 'Available businesses:', businesses.map(b => b.name))
          return false
        }

        // Get or create default account for business
        const defaultAccount = await getOrCreateDefaultAccount(supabase, targetBusinessId)

        // Save expense using helper function (creates transaction + approval record)
        const transaction = await saveExpense({
          supabase,
          userId: user.id,
          businessId: targetBusinessId, // Use resolved businessId
          accountId: defaultAccount.id,
          expense: {
            amount: draft.amount,
            description: draft.vendor || draft.description || 'Expense',
            category: draft.category,
            date: draft.date || new Date().toISOString().split('T')[0],
            receiptUrl: draft.receipt_url || null,
            notes: draft.description || null,
            paymentMethod: draft.payment_method || null,
            aiCategory: draft.category,
            aiConfidence: 0.95,
            priority: draft.priority || 'normal', // Use draft priority or default to normal
          },
        })

        // Transaction was successfully saved - return true even if callback fails
        // Wrap callback in try-catch to prevent false negatives
        if (onExpenseExtracted) {
          try {
            onExpenseExtracted(transaction)
          } catch (callbackError) {
            // Log callback error but don't fail the save
            console.warn('Callback error (expense was saved successfully):', callbackError)
          }
        }

        return true
      } catch (error) {
        console.error('Error saving expense:', error)
        return false
      }
    })

    const streamingCallbacks: StreamingCallbacks = {
      onTranscript: (text, isFinal) => {
        setAgentState(prev => ({
          ...prev,
          currentTranscript: text
        }))

        if (isFinal && handleUserMessageRef.current) {
          handleUserMessageRef.current(text)
        }
      },
      onStateChange: (state) => {
        setAgentState(prev => ({
          ...prev,
          state: state as any,
          isActive: state !== 'idle'
        }))

        // Update progress tracker
        if (state === 'listening') {
          progressTracker.start(true) // isVoice = true
        } else if (state === 'processing') {
          progressTracker.nextStep(true)
        }
      },
      onError: (error) => {
        const voiceError = voiceErrorHandler.handleError(error, {})
        setAgentState(prev => ({
          ...prev,
          error: voiceError.userMessage,
          state: 'idle',
          isActive: false
        }))
      }
    }

    streamingServiceRef.current = new VoiceStreamingService(
      undefined,
      streamingCallbacks
    )

    streamingServiceRef.current.initialize().catch(error => {
      const voiceError = voiceErrorHandler.handleError(error, {})
      setAgentState(prev => ({
        ...prev,
        error: voiceError.userMessage
      }))
    })

    // Add greeting to conversation history
    const greeting = personalityEngineRef.current.generateGreeting()
    conversationManagerRef.current.addMessage('assistant', greeting)

    return () => {
      streamingServiceRef.current?.cleanup()
      vadRef.current?.cleanup()
    }
  }, [onExpenseExtracted, businessId, user])

  /**
   * Convert text to speech and play
   * Stops recording during TTS to prevent echo/feedback
   * MUST be defined before handleUserMessage (used by it)
   */
  const speakResponse = useCallback(async (text: string): Promise<void> => {
    try {
      // Stop recording during TTS to prevent echo/feedback
      streamingServiceRef.current?.stopRecording()
      vadRef.current?.stopListening()

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          personality: config.personality || 'friendly'
        })
      })

      if (!response.ok) {
        console.warn('TTS failed, continuing without audio')
        return
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = reject
        audio.play()
      })

    } catch (error) {
      console.warn('TTS playback failed:', error)
    }
  }, [config.personality])

  // Speak greeting when voice agent is ready (after initialization) - ONLY ONCE
  useEffect(() => {
    if (conversationManagerRef.current && personalityEngineRef.current && streamingServiceRef.current && speakResponse && !greetingSpokenRef.current) {
      const greeting = personalityEngineRef.current.generateGreeting()
      const history = conversationManagerRef.current.getHistory()
      
      // Only speak greeting if it's the first assistant message and we haven't spoken it yet
      const firstAssistantMessage = history.find(m => m.role === 'assistant')
      if (firstAssistantMessage && firstAssistantMessage.content === greeting && agentState.state === 'idle' && !agentState.isActive && history.length === 1) {
        // Mark as spoken immediately to prevent repeats
        greetingSpokenRef.current = true
        
        // Use a small delay to ensure TTS is ready
        const timeoutId = setTimeout(async () => {
          try {
            await speakResponse(greeting)
          } catch (error) {
            console.warn('Failed to speak greeting:', error)
          }
        }, 500)
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [agentState.state, agentState.isActive, speakResponse])

  /**
   * Automatically resume listening after speaking (if conversation is active)
   * MUST be defined before handleUserMessage (used by it)
   */
  const autoResumeListening = useCallback(async () => {
    // Only auto-resume if conversation is active
    if (!conversationActiveRef.current) {
      return
    }

    // Wait a brief moment for natural pause (500ms)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Resume listening if conversation is still active
    if (conversationActiveRef.current && streamingServiceRef.current) {
      try {
        // Get microphone stream for VAD
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        // Re-initialize VAD if needed
        if (vadRef.current) {
          await vadRef.current.initialize()
          vadRef.current.startListening(stream)
        }

        await streamingServiceRef.current.startRecording()
        setAgentState(prev => ({
          ...prev,
          state: 'listening',
          isActive: true
        }))
      } catch (error) {
        console.warn('Failed to auto-resume listening:', error)
        // If auto-resume fails, go to idle (user can manually start)
        setAgentState(prev => ({
          ...prev,
          state: 'idle',
          isActive: false
        }))
      }
    }
  }, [])

  /**
   * Handle user message with enhanced processing
   * Uses speakResponse and autoResumeListening (must be defined after them)
   */
  const handleUserMessage = useCallback(async (text: string) => {
    if (!conversationManagerRef.current || !personalityEngineRef.current || !draftManagerRef.current) {
      return
    }

    // Update progress
    progressTracker.nextStep(true) // Move to understanding step

    // Add user message
    conversationManagerRef.current.addMessage('user', text)

    // Check for status questions
    const isStatusQuestion = /^(are you done|is it complete|what's left|is it ready)/i.test(text.trim())

    if (isStatusQuestion) {
      const draft = draftManagerRef.current.getDraft()
      const isSaved = draftManagerRef.current.getSavedStatus()
      const response = conversationStateManager.handleStatusQuestion(config.personality || 'friendly')

      conversationManagerRef.current.addMessage('assistant', response)

      const completionStatus = draftManagerRef.current.getCompletionStatus(['amount', 'vendor', 'category', 'business', 'date'])

      setAgentState(prev => ({
        ...prev,
        conversationHistory: conversationManagerRef.current!.getHistory(),
        state: 'speaking',
        completionStatus
      }))

      await speakResponse(response)
      
      // Auto-resume listening if conversation is active
      setAgentState(prev => ({ ...prev, state: 'idle' }))
      await autoResumeListening()
      return
    }

    // Detect follow-up answer (short response after a question)
    const draft = draftManagerRef.current.getDraft()
    const missing = draftManagerRef.current.getMissingFields(['amount', 'vendor', 'category', 'business', 'date'])
    const lastAssistantMessage = conversationManagerRef.current.getHistory()
      .filter(m => m.role === 'assistant')
      .slice(-1)[0]?.content || ''

    // Check if user is providing a short answer to a previous question (1-3 words as per recommendations)
    const isFollowUpAnswer = missing.length > 0 && 
      text.split(' ').length <= 3 && // Short answer (1-3 words as per Master System Prompt)
      (lastAssistantMessage.includes('Which') || 
       lastAssistantMessage.includes('What') || 
       lastAssistantMessage.includes('vendor') ||
       lastAssistantMessage.includes('business') ||
       lastAssistantMessage.includes('amount') ||
       lastAssistantMessage.includes('Could you') ||
       lastAssistantMessage.includes('Please') ||
       lastAssistantMessage.includes('hotel') ||
       lastAssistantMessage.includes('category'))

    // If follow-up answer detected, use conversation API for context-aware processing
    if (isFollowUpAnswer) {
      try {
        const response = await fetch('/api/voice/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            context: {
              conversationHistory: conversationManagerRef.current.getRecentContext(10),
              draft: draft,
              collectedData: draft
            },
            personality: config.personality || 'friendly',
            businessId: businessId,
            businesses: businesses
          })
        })

        if (!response.ok) {
          throw new Error('Failed to process follow-up answer')
        }

        const result = await response.json()

        // Process update_draft action
        if (result.action === 'update_draft' && result.updated_fields) {
          // Update draft fields
          Object.entries(result.updated_fields).forEach(([field, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              draftManagerRef.current!.updateField(field as keyof ExpenseDraft, value as any)
            }
          })

          // Update conversation state
          conversationStateManager.setDraft(draftManagerRef.current.getDraft())
        }

        // Get response message
        const responseMessage = result.assistant_message || "Got it! I've updated that information."

        // Add assistant response
        conversationManagerRef.current.addMessage('assistant', responseMessage)

        // Update state
        const updatedDraft = draftManagerRef.current.getDraft()
        setAgentState(prev => ({
          ...prev,
          conversationHistory: conversationManagerRef.current!.getHistory(),
          draft: updatedDraft,
          completionStatus: draftManagerRef.current!.getCompletionStatus(['amount', 'vendor', 'category', 'business', 'date']),
          state: 'speaking',
          progress: progressTracker.getState()
        }))

        // Speak response
        await speakResponse(responseMessage)

        // Check if expense is complete and needs saving
        const updatedMissing = draftManagerRef.current.getMissingFields(['amount', 'vendor', 'category', 'business', 'date'])
        if (updatedMissing.length === 0 && !draftManagerRef.current.getSavedStatus()) {
          // Complete - show preview and ask for confirmation
          const confirmationMessage = `Perfect! I've got all the information. Here's what I have: Amount: $${updatedDraft.amount}, Vendor: ${updatedDraft.vendor}, Category: ${updatedDraft.category}, Business: ${updatedDraft.business || 'Not set'}. Does this look correct?`
          
          conversationManagerRef.current.addMessage('assistant', confirmationMessage)
          setAgentState(prev => ({
            ...prev,
            conversationHistory: conversationManagerRef.current!.getHistory(),
            awaitingConfirmation: true,
            state: 'speaking'
          }))
          
          await speakResponse(confirmationMessage)
        }

        // Auto-resume listening
        setAgentState(prev => ({ ...prev, state: 'idle' }))
        await autoResumeListening()
        return
      } catch (error) {
        console.error('Error processing follow-up answer:', error)
        // Fall through to normal intent recognition
      }
    }

    // Recognize intent
    const intentResult = recognizeIntent(text)

    // Update progress
    progressTracker.nextStep(true) // Move to extracting step

    // Process intent
    setAgentState(prev => ({ ...prev, state: 'processing' }))

    try {
      const response = await processIntent(intentResult, text)

      // Update progress
      progressTracker.nextStep(true) // Move to validating step

      // Add assistant response
      conversationManagerRef.current.addMessage('assistant', response)

      // Update state with latest draft
      const updatedDraft = draftManagerRef.current!.getDraft()
      setAgentState(prev => ({
        ...prev,
        conversationHistory: conversationManagerRef.current!.getHistory(),
        draft: updatedDraft,
        completionStatus: draftManagerRef.current!.getCompletionStatus(['amount', 'vendor', 'category', 'business', 'date']),
        state: 'speaking',
        progress: progressTracker.getState()
      }))

      // Speak response
      await speakResponse(response)

      // Update progress
      progressTracker.nextStep(true) // Move to saving step if complete

      // Check if expense is complete and needs saving
      const draft = draftManagerRef.current.getDraft()
      const missing = draftManagerRef.current.getMissingFields(['amount', 'vendor', 'category', 'business', 'date'])

      if (missing.length === 0 && !draftManagerRef.current.getSavedStatus()) {
        // Complete but not saved - show preview and ask for confirmation
        const businessName = businesses.find(b => b.id === draft.business)?.name || draft.business || 'Unknown Business'
        
        // Generate confirmation message with expense preview
        const confirmationMessage = `I've detected this as a business expense. Let me confirm:\n\n` +
          `- Amount: $${draft.amount}\n` +
          `- Vendor: ${draft.vendor || 'N/A'}\n` +
          `- Category: ${draft.category || 'N/A'}\n` +
          `- Business: ${businessName}\n` +
          `- Date: ${draft.date ? new Date(draft.date).toLocaleDateString() : new Date().toLocaleDateString()}\n\n` +
          `Does this look correct? Say "yes" to confirm or "no" to make changes.`

        // Update state to show preview and await confirmation
        setAgentState(prev => ({
          ...prev,
          draft: draft,
          state: 'awaiting_confirmation',
          awaitingConfirmation: true,
          completionStatus: draftManagerRef.current!.getCompletionStatus(['amount', 'vendor', 'category', 'business', 'date'])
        }))

        conversationManagerRef.current.addMessage('assistant', confirmationMessage)
        await speakResponse(confirmationMessage)

        // Auto-resume listening for confirmation
        await autoResumeListening()
        return
      }

      setAgentState(prev => ({
        ...prev,
        state: 'idle',
        progress: progressTracker.getState()
      }))

      // Auto-resume listening if conversation is active and expense is incomplete
      // This ensures continuous conversation flow
      if (missing.length > 0 && conversationActiveRef.current) {
        await autoResumeListening()
      }

    } catch (error) {
      // Only show error if expense wasn't successfully saved
      const draft = draftManagerRef.current?.getDraft()
      const isSaved = draftManagerRef.current?.getSavedStatus()
      
      if (!isSaved) {
        const voiceError = voiceErrorHandler.handleError(error instanceof Error ? error : String(error), {})
        const friendlyError = personalityEngineRef.current.generateErrorMessage(voiceError.userMessage)

        conversationManagerRef.current.addMessage('assistant', friendlyError)

        setAgentState(prev => ({
          ...prev,
          error: voiceError.userMessage,
          conversationHistory: conversationManagerRef.current!.getHistory(),
          state: 'idle'
        }))

        // Only speak error if expense truly failed to save
        await speakResponse(friendlyError)
        
        // Auto-resume listening after error if conversation is active
        await autoResumeListening()
      } else {
        // Expense was saved successfully to inbox - suppress error voice message
        // Just clear error state silently (don't speak error)
        setAgentState(prev => ({
          ...prev,
          error: null,
          state: 'idle'
        }))
        // Don't call speakResponse here - expense was saved successfully
      }
    }
  }, [config.personality, onExpenseExtracted, businessId, businesses, autoResumeListening, speakResponse])

  /**
   * Process intent and generate response
   */
  const processIntent = useCallback(async (
    intentResult: { intent: string; entities: Record<string, any>; confidence: number },
    userText: string
  ): Promise<string> => {
    if (!personalityEngineRef.current || !draftManagerRef.current) {
      return 'I\'m not ready yet. Please try again.'
    }

    const { intent } = intentResult

    switch (intent) {
      case 'expense_entry':
        return await handleExpenseEntry(intentResult, userText)

      case 'expense_query':
        return await handleExpenseQuery(intentResult)

      case 'correction':
        return await handleCorrection(intentResult)

      case 'confirmation':
        return await handleConfirmation(intentResult, userText)

      case 'greeting':
        return personalityEngineRef.current.generateGreeting()

      case 'reset':
        // Reset draft and conversation state
        draftManagerRef.current?.reset()
        conversationManagerRef.current?.reset()
        conversationStateManager.reset()
        setAgentState(prev => ({
          ...prev,
          draft: null,
          completionStatus: null,
          retryCount: 0
        }))
        return "Got it! Starting fresh. What expense would you like to add?"

      default:
        return personalityEngineRef.current.generateResponse(
          'I\'m not sure I understand. Could you rephrase that?',
          { conversational: true }
        )
    }
  }, [onExpenseExtracted, businessId, businesses])

  /**
   * Handle expense entry
   */
  const handleExpenseEntry = useCallback(async (
    intentResult: { intent: string; entities: Record<string, any>; confidence: number },
    userText: string
  ): Promise<string> => {
    if (!personalityEngineRef.current || !draftManagerRef.current) {
      return ''
    }

    try {
      // Call extract-expense API
      const response = await fetch('/api/voice/extract-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          businessId: businessId,
          businesses: businesses,
          context: {
            conversationHistory: conversationManagerRef.current?.getRecentContext(10).map(m => ({
              role: m.role,
              content: m.content
            })),
            draft: draftManagerRef.current.getDraft(),
            collectedData: draftManagerRef.current.getDraft()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to extract expense')
      }

      const result = await response.json()

      // Update draft manager with extracted data
      if (result.draft) {
        Object.entries(result.draft).forEach(([field, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            draftManagerRef.current!.updateField(field as keyof ExpenseDraft, value)
          }
        })
      }

      // Update conversation state
      conversationStateManager.setDraft(draftManagerRef.current.getDraft())

      // Check what's missing
      const required = ['amount', 'vendor', 'category', 'business', 'date']
      const missing = draftManagerRef.current.getMissingFields(required)
      const currentDraft = draftManagerRef.current.getDraft()

      if (missing.length === 0) {
        // Complete - reset retry count
        setAgentState(prev => ({ ...prev, retryCount: 0 }))
        return result.assistant_message || "Perfect! I have all the information. Saving your expense now..."
      }

      // Check retry count
      const currentRetryCount = agentState.retryCount || 0
      const maxRetriesValue = agentState.maxRetries || maxRetries

      if (currentRetryCount >= maxRetriesValue) {
        // Max retries reached - trigger manual entry
        const transitionMessage = "I'm unable to complete the transaction automatically. Please use the manual entry option to finish adding your expense."
        
        // Speak the transition message
        await speakResponse(transitionMessage)
        
        // Get current draft for manual entry
        const draftForManual = draftManagerRef.current.getDraft()
        
        // Trigger manual entry callback
        if (onOpenManualEntry && draftForManual) {
          // Reset retry count
          setAgentState(prev => ({ 
            ...prev, 
            retryCount: 0
          }))
          
          // Call callback to open manual entry
          onOpenManualEntry(draftForManual)
        }
        
        return transitionMessage
      }

      // Increment retry count
      setAgentState(prev => ({ 
        ...prev, 
        retryCount: (prev.retryCount || 0) + 1 
      }))

      // Missing fields - format structured clarification response
      if (result.assistant_message) {
        return result.assistant_message
      }

      // Build structured clarification: show what was understood, then ask for missing
      const understood: string[] = []
      if (currentDraft.amount) understood.push(`amount is $${currentDraft.amount}`)
      if (currentDraft.vendor) understood.push(`vendor is ${currentDraft.vendor}`)
      if (currentDraft.category) understood.push(`category is ${currentDraft.category}`)
      if (currentDraft.business) {
        const businessName = businesses.find(b => b.id === currentDraft.business)?.name || currentDraft.business
        understood.push(`business is ${businessName}`)
      }

      let clarificationMessage = ''
      if (understood.length > 0) {
        clarificationMessage = `I understood the ${understood.join(', ')}. `
      }

      // Add specific question for first missing field (never ask for already-provided fields)
      if (missing.includes('vendor')) {
        // Enhanced vendor question with context
        if (currentDraft.amount) {
          clarificationMessage += `I understood the amount is $${currentDraft.amount}. Which hotel or vendor should I record this under?`
        } else {
          clarificationMessage += "Which hotel or vendor should I record this under?"
        }
      } else if (missing.includes('amount')) {
        clarificationMessage += "What's the amount for this expense?"
      } else if (missing.includes('business')) {
        // Use current business context if available
        if (businessId && businesses.length > 0) {
          const currentBusiness = businesses.find(b => b.id === businessId)
          if (currentBusiness) {
            clarificationMessage += `Which business should I charge this to? (Currently using ${currentBusiness.name})`
          } else {
            clarificationMessage += "Which business should I charge this to?"
          }
        } else {
          clarificationMessage += "Which business should I charge this to?"
        }
      } else if (missing.includes('category')) {
        // Only ask if category truly cannot be inferred
        clarificationMessage += "What category should this be under?"
      } else {
        clarificationMessage += "I need a bit more information to save this expense."
      }

      return clarificationMessage

    } catch (error) {
      const voiceError = voiceErrorHandler.handleError(error instanceof Error ? error : String(error), {})
      return personalityEngineRef.current.generateErrorMessage(voiceError.userMessage)
    }
  }, [onExpenseExtracted, businessId, businesses, onOpenManualEntry, agentState.retryCount, agentState.maxRetries, maxRetries, speakResponse])

  /**
   * Handle expense query
   */
  const handleExpenseQuery = useCallback(async (
    intentResult: { intent: string; entities: Record<string, any>; confidence: number }
  ): Promise<string> => {
    // TODO: Implement expense query
    return 'I\'m working on fetching your expense data. This feature is coming soon!'
  }, [])

  /**
   * Handle correction
   */
  const handleCorrection = useCallback(async (
    intentResult: { intent: string; entities: Record<string, any>; confidence: number }
  ): Promise<string> => {
    if (!personalityEngineRef.current || !draftManagerRef.current) {
      return ''
    }

    // Update collected data
    if (intentResult.entities.field && intentResult.entities.newValue) {
      draftManagerRef.current.updateField(
        intentResult.entities.field as keyof ExpenseDraft,
        intentResult.entities.newValue
      )
    }

    return personalityEngineRef.current.generateResponse(
      `Got it! I've updated the ${intentResult.entities.field}.`,
      { conversational: true }
    )
  }, [])

  /**
   * Handle confirmation with voice approval support
   * Detects yes/no responses and handles confirmation flow
   */
  const handleConfirmation = useCallback(async (
    intentResult: { intent: string; entities: Record<string, any>; confidence: number },
    userText?: string
  ): Promise<string> => {
    if (!personalityEngineRef.current || !draftManagerRef.current) {
      return ''
    }

    const draft = draftManagerRef.current.getDraft()
    const isAwaitingConfirmation = agentState.awaitingConfirmation

    // Check for yes/no responses in user text (voice approval)
    let isYes = false
    let isNo = false

    if (userText) {
      isYes = /^(yes|yeah|yep|yup|correct|right|that's right|sounds good|confirm|approved|ok|okay|sure)$/i.test(userText.trim())
      isNo = /^(no|nope|nah|incorrect|wrong|change|modify|edit|fix|cancel)$/i.test(userText.trim())
    }

    // Handle voice approval confirmation
    if (isAwaitingConfirmation) {
      if (isYes || intentResult.entities.confirmed) {
        // User confirmed - save expense
        setAgentState(prev => ({ ...prev, state: 'completing', awaitingConfirmation: false }))
        
        const saved = await completionGuarantee.ensureExpenseSaved(draft)

        if (saved.success) {
          draftManagerRef.current.markAsComplete()
          progressTracker.complete()
          
          // Clear any error state when save succeeds and reset retry count
          setAgentState(prev => ({
            ...prev,
            draft: null,
            awaitingConfirmation: false,
            state: 'idle',
            completionStatus: null,
            error: null, // Explicitly clear error
            retryCount: 0 // Reset retry count on successful save
          }))
          
          return "Perfect! I've saved your expense. It's now in your inbox for approval. Anything else?"
        } else {
          setAgentState(prev => ({ ...prev, awaitingConfirmation: false, state: 'idle' }))
          return "I couldn't save the expense automatically. Please use the manual entry form to edit and save it. Would you like me to help you with that?"
        }
      } else if (isNo) {
        // User wants to make changes
        setAgentState(prev => ({ ...prev, awaitingConfirmation: false, state: 'idle' }))
        return "No problem! What would you like to change? You can say things like 'change the amount to $50' or 'update the business to ABC Company'."
      } else {
        // Unclear response - ask for clarification
        return "I didn't catch that. Please say 'yes' to confirm or 'no' to make changes."
      }
    }

    // Legacy confirmation handling (if entities.confirmed exists)
    if (intentResult.entities.confirmed) {
      const saved = await completionGuarantee.ensureExpenseSaved(draft)

      if (saved.success) {
        draftManagerRef.current.markAsComplete()
        // Clear any error state when save succeeds and reset retry count
        setAgentState(prev => ({
          ...prev,
          draft: null,
          awaitingConfirmation: false,
          state: 'idle',
          error: null, // Explicitly clear error
          retryCount: 0 // Reset retry count on successful save
        }))
        return personalityEngineRef.current.generateSuccessMessage('Expense saved')
      } else {
        return "I couldn't save the expense automatically. Please use the manual entry form to edit and save it. Would you like me to help you with that?"
      }
    } else {
      return personalityEngineRef.current.generateResponse(
        'No problem! What would you like to do instead?',
        { conversational: true }
      )
    }
  }, [onExpenseExtracted, agentState.awaitingConfirmation])

  // Update ref when handleUserMessage changes
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage
  }, [handleUserMessage])

  /**
   * Start listening with VAD and activate conversation loop
   */
  const startListening = useCallback(async () => {
    try {
      conversationActiveRef.current = true // Enable conversation loop
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialize VAD with stream
      if (vadRef.current) {
        await vadRef.current.initialize()
        vadRef.current.startListening(stream)
      }

      // Start streaming service
      await streamingServiceRef.current?.startRecording()

      // Start progress tracking
      progressTracker.start(true)

      setAgentState(prev => ({
        ...prev,
        state: 'listening',
        isActive: true,
        progress: progressTracker.getState()
      }))

      // Monitor VAD for speech detection
      const vadInterval = setInterval(() => {
        if (vadRef.current) {
          if (vadRef.current.hasStoppedSpeaking()) {
            // User stopped speaking, process
            streamingServiceRef.current?.stopRecording()
            clearInterval(vadInterval)
          } else if (vadRef.current.hasWaitedTooLong()) {
            // Waited too long, stop listening
            streamingServiceRef.current?.stopRecording()
            clearInterval(vadInterval)
            setAgentState(prev => ({
              ...prev,
              state: 'idle',
              error: "I didn't hear anything. Please try again."
            }))
          }
        }
      }, 100) // Check every 100ms

    } catch (error) {
      conversationActiveRef.current = false
      const voiceError = voiceErrorHandler.handleError(error instanceof Error ? error : String(error), {})
      setAgentState(prev => ({
        ...prev,
        error: voiceError.userMessage,
        state: 'idle',
        isActive: false
      }))
    }
  }, [])

  /**
   * Stop listening and deactivate conversation loop
   */
  const stopListening = useCallback(() => {
    conversationActiveRef.current = false // Disable conversation loop
    streamingServiceRef.current?.stopRecording()
    vadRef.current?.stopListening()

    setAgentState(prev => ({
      ...prev,
      state: 'idle',
      isActive: false
    }))
  }, [])

  /**
   * Pause conversation (stop auto-resume but keep state)
   */
  const pauseConversation = useCallback(() => {
    conversationActiveRef.current = false
    streamingServiceRef.current?.stopRecording()
    vadRef.current?.stopListening()
    setAgentState(prev => ({
      ...prev,
      state: 'idle'
    }))
  }, [])

  /**
   * Resume conversation (restart auto-resume)
   */
  const resumeConversation = useCallback(async () => {
    conversationActiveRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (vadRef.current) {
        await vadRef.current.initialize()
        vadRef.current.startListening(stream)
      }

      await streamingServiceRef.current?.startRecording()
      setAgentState(prev => ({
        ...prev,
        state: 'listening',
        isActive: true
      }))
    } catch (error) {
      conversationActiveRef.current = false
      const voiceError = voiceErrorHandler.handleError(error instanceof Error ? error : String(error), {})
      setAgentState(prev => ({
        ...prev,
        error: voiceError.userMessage,
        state: 'idle',
        isActive: false
      }))
    }
  }, [])

  /**
   * Reset conversation
   * MUST be defined before endConversation (used by it)
   */
  const resetConversation = useCallback(() => {
    conversationManagerRef.current?.reset()
    draftManagerRef.current?.reset()
    conversationStateManager.reset()
    progressTracker.reset()

    setAgentState(prev => ({
      ...prev,
      conversationHistory: [],
      currentTranscript: '',
      error: null,
      draft: null,
      completionStatus: null,
      progress: null
    }))
  }, [])

  /**
   * End conversation (stop and reset)
   * Uses resetConversation (must be defined after it)
   */
  const endConversation = useCallback(() => {
    conversationActiveRef.current = false
    streamingServiceRef.current?.stopRecording()
    vadRef.current?.stopListening()
    resetConversation()
  }, [resetConversation])

  /**
   * Change personality
   */
  const setPersonality = useCallback((personality: PersonalityType) => {
    personalityEngineRef.current?.setPersonality(personality)
  }, [])

  return {
    ...agentState,
    startListening,
    stopListening,
    resetConversation,
    setPersonality,
    pauseConversation,
    resumeConversation,
    endConversation,
    conversationManager: conversationManagerRef.current,
    personalityEngine: personalityEngineRef.current,
    draftManager: draftManagerRef.current,
    draft: agentState.draft,
    awaitingConfirmation: agentState.awaitingConfirmation
  }
}


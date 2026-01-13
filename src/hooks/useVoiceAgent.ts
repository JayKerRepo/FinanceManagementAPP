/**
 * useVoiceAgent Hook
 * Main hook for managing voice agent functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { VoiceStreamingService, VoiceStreamingConfig, StreamingCallbacks } from '../services/VoiceStreamingService'
import { ConversationManager, ConversationMessage } from '../services/ConversationManager'
import { PersonalityEngine, PersonalityType } from '../services/PersonalityEngine'
import { recognizeIntent, IntentResult } from '../lib/voiceAgentUtils'

export interface VoiceAgentState {
  isActive: boolean
  state: 'idle' | 'listening' | 'processing' | 'speaking'
  currentTranscript: string
  conversationHistory: ConversationMessage[]
  error: string | null
}

export interface VoiceAgentConfig {
  personality?: PersonalityType
  websocketUrl?: string
  streamingConfig?: VoiceStreamingConfig
  autoStart?: boolean
  onExpenseExtracted?: (expense: any) => void
  businessId?: string
}

export function useVoiceAgent(config: VoiceAgentConfig = {}) {
  const { onExpenseExtracted, businessId } = config
  const [agentState, setAgentState] = useState<VoiceAgentState>({
    isActive: false,
    state: 'idle',
    currentTranscript: '',
    conversationHistory: [],
    error: null
  })

  const streamingServiceRef = useRef<VoiceStreamingService | null>(null)
  const conversationManagerRef = useRef<ConversationManager | null>(null)
  const personalityEngineRef = useRef<PersonalityEngine | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const handleUserMessageRef = useRef<((text: string) => Promise<void>) | null>(null)
  const conversationActiveRef = useRef<boolean>(false) // Track if conversation loop is active

  // Initialize services
  useEffect(() => {
    conversationManagerRef.current = new ConversationManager()
    personalityEngineRef.current = new PersonalityEngine(config.personality || 'friendly')
    
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
          state,
          isActive: state !== 'idle'
        }))
      },
      onError: (error) => {
        setAgentState(prev => ({
          ...prev,
          error: error.message,
          state: 'idle',
          isActive: false
        }))
      }
    }

    streamingServiceRef.current = new VoiceStreamingService(
      config.streamingConfig,
      streamingCallbacks
    )

    // Initialize streaming service
    streamingServiceRef.current.initialize().catch(error => {
      setAgentState(prev => ({
        ...prev,
        error: error.message
      }))
    })

    // Add greeting message
    const greeting = personalityEngineRef.current.generateGreeting()
    conversationManagerRef.current.addMessage('assistant', greeting)

    return () => {
      streamingServiceRef.current?.cleanup()
    }
  }, [config.personality])

  /**
   * Process intent and generate response
   */
  const processIntent = useCallback(async (
    intentResult: IntentResult,
    userText: string
  ): Promise<string> => {
    if (!personalityEngineRef.current || !conversationManagerRef.current) {
      return 'I\'m not ready yet. Please try again.'
    }

    const { intent, entities } = intentResult

    // Handle different intents
    switch (intent) {
      case 'expense_entry':
        return await handleExpenseEntry(entities, userText)
      
      case 'expense_query':
        return await handleExpenseQuery(entities)
      
      case 'invoice_create':
        return await handleInvoiceCreate(entities)
      
      case 'invoice_query':
        return await handleInvoiceQuery()
      
      case 'budget_query':
        return await handleBudgetQuery(entities)
      
      case 'report_request':
        return await handleReportRequest(entities)
      
      case 'insight_request':
        return await handleInsightRequest()
      
      case 'correction':
        return await handleCorrection(entities)
      
      case 'confirmation':
        return await handleConfirmation(entities)
      
      case 'greeting':
        return personalityEngineRef.current.generateGreeting()
      
      default:
      return personalityEngineRef.current.generateResponse(
        'I\'m not sure I understand. Could you rephrase that?',
        { conversational: true }
      )
    }
  }, [onExpenseExtracted, businessId])

  /**
   * Handle expense entry
   */
  const handleExpenseEntry = useCallback(async (
    entities: Record<string, any>,
    userText: string
  ): Promise<string> => {
    if (!personalityEngineRef.current) return ''

    // Call expense extraction API
    try {
      const response = await fetch('/api/extract-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          businessId: businessId,
          context: {
            ...conversationManagerRef.current?.getContext(),
            conversationHistory: conversationManagerRef.current?.getRecentContext(5).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to extract expense')
      }

      const { expense } = await response.json()

      // Call callback if provided
      if (onExpenseExtracted) {
        onExpenseExtracted(expense)
      }

      // Generate confirmation message
      return personalityEngineRef.current.generateExpenseConfirmation({
        amount: expense.amount,
        vendor: expense.vendor,
        category: expense.category,
        business: expense.business
      })

    } catch (error) {
      return personalityEngineRef.current.generateErrorMessage(
        'I had trouble understanding that expense. Could you try again?'
      )
    }
  }, [onExpenseExtracted, businessId])

  /**
   * Handle expense query
   */
  const handleExpenseQuery = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    // TODO: Implement expense query
    return 'I\'m working on fetching your expense data. This feature is coming soon!'
  }, [])

  /**
   * Handle invoice create
   */
  const handleInvoiceCreate = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    // TODO: Implement invoice creation
    return 'I\'m working on creating that invoice. This feature is coming soon!'
  }, [])

  /**
   * Handle invoice query
   */
  const handleInvoiceQuery = useCallback(async (): Promise<string> => {
    // TODO: Implement invoice query
    return 'I\'m working on fetching your invoice data. This feature is coming soon!'
  }, [])

  /**
   * Handle budget query
   */
  const handleBudgetQuery = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    // TODO: Implement budget query
    return 'I\'m working on fetching your budget data. This feature is coming soon!'
  }, [])

  /**
   * Handle report request
   */
  const handleReportRequest = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    // TODO: Implement report request
    return 'I\'m working on generating that report. This feature is coming soon!'
  }, [])

  /**
   * Handle insight request
   */
  const handleInsightRequest = useCallback(async (): Promise<string> => {
    // TODO: Implement insight request
    return 'I\'m working on generating insights. This feature is coming soon!'
  }, [])

  /**
   * Handle correction
   */
  const handleCorrection = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    if (!personalityEngineRef.current) return ''

    // Update collected data
    if (entities.field && entities.newValue) {
      conversationManagerRef.current?.updateCollectedData({
        [entities.field]: entities.newValue
      })
    }

    return personalityEngineRef.current.generateResponse(
      `Got it! I've updated the ${entities.field}.`,
      { conversational: true }
    )
  }, [])

  /**
   * Handle confirmation
   */
  const handleConfirmation = useCallback(async (
    entities: Record<string, any>
  ): Promise<string> => {
    if (!personalityEngineRef.current) return ''

    if (entities.confirmed) {
      // Execute pending action
      const pendingAction = conversationManagerRef.current?.getPendingAction()
      if (pendingAction) {
        // TODO: Execute action
        return personalityEngineRef.current.generateSuccessMessage(pendingAction)
      }
      return personalityEngineRef.current.generateResponse('Great!', { conversational: true })
    } else {
      return personalityEngineRef.current.generateResponse(
        'No problem! What would you like to do instead?',
        { conversational: true }
      )
    }
  }, [onExpenseExtracted, businessId])

  /**
   * Convert text to speech and play
   * Stops recording during TTS to prevent echo/feedback
   */
  const speakResponse = useCallback(async (text: string): Promise<void> => {
    try {
      // Stop recording during TTS to prevent echo/feedback
      streamingServiceRef.current?.stopRecording()

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
      // Continue without audio
    }
  }, [config.personality])

  /**
   * Automatically resume listening after speaking (if conversation is active)
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
        await streamingServiceRef.current.startRecording()
        setAgentState(prev => ({
          ...prev,
          state: 'listening'
        }))
      } catch (error) {
        console.warn('Failed to auto-resume listening:', error)
        // If auto-resume fails, go to idle (user can manually start)
        setAgentState(prev => ({
          ...prev,
          state: 'idle'
        }))
      }
    }
  }, [])

  /**
   * Handle user message - must be defined after processIntent and speakResponse
   */
  const handleUserMessage = useCallback(async (text: string) => {
    if (!conversationManagerRef.current || !personalityEngineRef.current) return

    // Stop listening while processing (prevent echo/feedback)
    streamingServiceRef.current?.stopRecording()

    // Add user message to conversation
    conversationManagerRef.current.addMessage('user', text)

    // Recognize intent
    const intentResult = recognizeIntent(text)
    conversationManagerRef.current.addMessage('user', text, {
      intent: intentResult.intent,
      entities: intentResult.entities,
      confidence: intentResult.confidence
    })

    // Update state
    setAgentState(prev => ({
      ...prev,
      state: 'processing',
      currentTranscript: ''
    }))

    // Process intent and generate response
    try {
      const response = await processIntent(intentResult, text)
      
      // Add assistant response
      conversationManagerRef.current.addMessage('assistant', response)

      // Update state
      setAgentState(prev => ({
        ...prev,
        conversationHistory: conversationManagerRef.current!.getHistory(),
        state: 'speaking'
      }))

      // Convert to speech and play
      await speakResponse(response)

      // After speaking, automatically resume listening for next turn
      setAgentState(prev => ({
        ...prev,
        state: 'idle'
      }))

      // Auto-resume listening if conversation is active
      await autoResumeListening()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      const friendlyError = personalityEngineRef.current.generateErrorMessage(errorMessage)
      
      conversationManagerRef.current.addMessage('assistant', friendlyError)
      
      setAgentState(prev => ({
        ...prev,
        error: errorMessage,
        conversationHistory: conversationManagerRef.current!.getHistory(),
        state: 'idle'
      }))

      // Speak error message and resume listening
      await speakResponse(friendlyError)
      
      // Auto-resume listening after error if conversation is active
      await autoResumeListening()
    }
  }, [processIntent, speakResponse, autoResumeListening])

  // Update ref when handleUserMessage changes
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage
  }, [handleUserMessage])

  /**
   * Start listening and activate conversation loop
   */
  const startListening = useCallback(async () => {
    try {
      conversationActiveRef.current = true // Enable conversation loop
      await streamingServiceRef.current?.startRecording()
      setAgentState(prev => ({
        ...prev,
        state: 'listening',
        isActive: true
      }))
    } catch (error) {
      conversationActiveRef.current = false
      setAgentState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start listening',
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
      await streamingServiceRef.current?.startRecording()
      setAgentState(prev => ({
        ...prev,
        state: 'listening',
        isActive: true
      }))
    } catch (error) {
      conversationActiveRef.current = false
      setAgentState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to resume listening',
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
    setAgentState(prev => ({
      ...prev,
      conversationHistory: [],
      currentTranscript: '',
      error: null
    }))
  }, [])

  /**
   * End conversation (stop and reset)
   * Uses resetConversation (must be defined after it)
   */
  const endConversation = useCallback(() => {
    conversationActiveRef.current = false
    streamingServiceRef.current?.stopRecording()
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
    personalityEngine: personalityEngineRef.current
  }
}


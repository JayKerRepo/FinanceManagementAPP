/**
 * ConversationManager
 * Manages conversation state, context, and multi-turn dialogue flow
 */

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    intent?: string
    entities?: Record<string, any>
    confidence?: number
  }
}

export interface ConversationContext {
  currentIntent?: string
  pendingAction?: string
  collectedData?: Record<string, any>
  conversationHistory: ConversationMessage[]
  userPreferences?: {
    defaultBusiness?: string
    defaultCategory?: string
    personality?: string
  }
}

export type ConversationState = 
  | 'idle'
  | 'listening'
  | 'processing'
  | 'confirming'
  | 'executing'
  | 'speaking'

export class ConversationManager {
  private context: ConversationContext
  private state: ConversationState = 'idle'
  private maxHistoryLength = 50

  constructor(initialContext?: Partial<ConversationContext>) {
    this.context = {
      conversationHistory: [],
      ...initialContext
    }
  }

  /**
   * Add message to conversation history
   */
  addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ConversationMessage['metadata']
  ): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      metadata
    }

    this.context.conversationHistory.push(message)

    // Keep history within limit
    if (this.context.conversationHistory.length > this.maxHistoryLength) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-this.maxHistoryLength)
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.context.conversationHistory]
  }

  /**
   * Get recent conversation context (last N messages)
   */
  getRecentContext(count: number = 10): ConversationMessage[] {
    return this.context.conversationHistory.slice(-count)
  }

  /**
   * Update conversation context
   */
  updateContext(updates: Partial<ConversationContext>): void {
    this.context = {
      ...this.context,
      ...updates
    }
  }

  /**
   * Get current context
   */
  getContext(): ConversationContext {
    return { ...this.context }
  }

  /**
   * Set conversation state
   */
  setState(state: ConversationState): void {
    this.state = state
  }

  /**
   * Get current state
   */
  getState(): ConversationState {
    return this.state
  }

  /**
   * Update collected data (for multi-turn conversations)
   */
  updateCollectedData(data: Record<string, any>): void {
    this.context.collectedData = {
      ...this.context.collectedData,
      ...data
    }
  }

  /**
   * Get collected data
   */
  getCollectedData(): Record<string, any> {
    return { ...(this.context.collectedData || {}) }
  }

  /**
   * Clear collected data
   */
  clearCollectedData(): void {
    this.context.collectedData = {}
  }

  /**
   * Set current intent
   */
  setIntent(intent: string): void {
    this.context.currentIntent = intent
  }

  /**
   * Get current intent
   */
  getIntent(): string | undefined {
    return this.context.currentIntent
  }

  /**
   * Set pending action
   */
  setPendingAction(action: string): void {
    this.context.pendingAction = action
  }

  /**
   * Get pending action
   */
  getPendingAction(): string | undefined {
    return this.context.pendingAction
  }

  /**
   * Clear pending action
   */
  clearPendingAction(): void {
    this.context.pendingAction = undefined
  }

  /**
   * Reset conversation (clear history and context)
   */
  reset(): void {
    this.context = {
      conversationHistory: [],
      userPreferences: this.context.userPreferences
    }
    this.state = 'idle'
  }

  /**
   * Get conversation summary for AI context
   */
  getConversationSummary(): string {
    const recentMessages = this.getRecentContext(5)
    return recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
  }

  /**
   * Check if conversation has context
   */
  hasContext(): boolean {
    return this.context.conversationHistory.length > 0 || 
           Object.keys(this.context.collectedData || {}).length > 0
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): ConversationContext['userPreferences'] {
    return { ...this.context.userPreferences }
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<ConversationContext['userPreferences']>): void {
    this.context.userPreferences = {
      ...this.context.userPreferences,
      ...preferences
    }
  }
}


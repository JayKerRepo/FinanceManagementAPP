/**
 * ConversationStateManager
 * 
 * Manages conversation state and handles status questions intelligently.
 * Tracks whether expense is complete, saved, and what follow-up is needed.
 * 
 * @class ConversationStateManager
 */

import { ExpenseDraft, CompletionStatus } from './interfaces/IExpenseDraftManager'
import { smartQuestionGenerator } from './SmartQuestionGenerator'
import { PersonalityType } from './interfaces/ISmartQuestionGenerator'

export type ConversationState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'asking'
  | 'completing'
  | 'complete'
  | 'error'

export type AgentAction =
  | { action: 'interpret'; draft: ExpenseDraft; needs_followup: string[]; assistant_message: string }
  | { action: 'request_more_info'; missing: string[]; assistant_message: string }
  | { action: 'create_expense'; data: ExpenseDraft; assistant_message: string }
  | { action: 'update_draft'; updated_fields: Partial<ExpenseDraft>; assistant_message: string }
  | { action: 'status_response'; status: CompletionStatus; assistant_message: string }

export class ConversationStateManager {
  private state: ConversationState = 'idle'
  private draft: ExpenseDraft | null = null
  private isSaved: boolean = false
  private requiredFields: string[] = ['amount', 'vendor', 'category', 'business', 'date']

  /**
   * Set current conversation state
   * @param state - New state
   */
  setState(state: ConversationState): void {
    this.state = state
  }

  /**
   * Get current conversation state
   * @returns Current state
   */
  getState(): ConversationState {
    return this.state
  }

  /**
   * Set expense draft
   * @param draft - Expense draft
   */
  setDraft(draft: ExpenseDraft): void {
    this.draft = draft
  }

  /**
   * Get expense draft
   * @returns Current draft or null
   */
  getDraft(): ExpenseDraft | null {
    return this.draft ? { ...this.draft } : null
  }

  /**
   * Mark expense as saved
   */
  markAsSaved(): void {
    this.isSaved = true
    this.state = 'complete'
  }

  /**
   * Check if expense is saved
   * @returns True if saved
   */
  getSavedStatus(): boolean {
    return this.isSaved
  }

  /**
   * Handle status questions like "are you done?", "is it complete?"
   * @param personality - Personality type for response tone
   * @returns Response message
   */
  handleStatusQuestion(personality: PersonalityType = 'friendly'): string {
    if (!this.draft) {
      return "I'm ready to help! What expense would you like to add?"
    }

    return smartQuestionGenerator.handleStatusQuestion(
      this.draft,
      this.isSaved,
      personality
    )
  }

  /**
   * Determine next action based on current draft state
   * @param personality - Personality type
   * @returns Next agent action
   */
  getNextAction(personality: PersonalityType = 'friendly'): AgentAction {
    if (!this.draft) {
      return {
        action: 'interpret',
        draft: {
          amount: null,
          vendor: null,
          category: null,
          business: null,
          date: null,
          payment_method: null,
          description: null
        },
        needs_followup: this.requiredFields,
        assistant_message: "I'm ready to help! Tell me about your expense."
      }
    }

    // Check what's missing
    const missing = this.requiredFields.filter(
      field => !this.draft![field as keyof ExpenseDraft] || 
               this.draft![field as keyof ExpenseDraft] === ''
    )

    // If complete and saved, return completion
    if (missing.length === 0 && this.isSaved) {
      return {
        action: 'create_expense',
        data: this.draft,
        assistant_message: "All set! Your expense has been saved."
      }
    }

    // If complete but not saved, return ready to save
    if (missing.length === 0 && !this.isSaved) {
      return {
        action: 'create_expense',
        data: this.draft,
        assistant_message: "Perfect! I have all the information. Saving your expense now..."
      }
    }

    // If missing fields, ask for follow-up
    const question = smartQuestionGenerator.generateFollowUpQuestion(
      missing,
      this.draft,
      personality
    )

    return {
      action: 'request_more_info',
      missing: [missing[0]], // Only ask for first missing field
      assistant_message: question
    }
  }

  /**
   * Check if follow-up question should be asked
   * @returns True if follow-up needed
   */
  shouldAskFollowUp(): boolean {
    if (!this.draft) {
      return false
    }

    return smartQuestionGenerator.shouldAskFollowUp(this.draft, this.requiredFields)
  }

  /**
   * Get completion status
   * @returns Completion status
   */
  getCompletionStatus(): CompletionStatus {
    if (!this.draft) {
      return {
        isComplete: false,
        missingFields: this.requiredFields,
        hasBeenSaved: false,
        completionPercentage: 0
      }
    }

    const missing = this.requiredFields.filter(
      field => !this.draft![field as keyof ExpenseDraft] || 
               this.draft![field as keyof ExpenseDraft] === ''
    )

    const total = this.requiredFields.length
    const completed = total - missing.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      isComplete: missing.length === 0,
      missingFields: missing,
      hasBeenSaved: this.isSaved,
      completionPercentage: percentage
    }
  }

  /**
   * Reset conversation state
   */
  reset(): void {
    this.state = 'idle'
    this.draft = null
    this.isSaved = false
  }
}

// Export singleton instance
export const conversationStateManager = new ConversationStateManager()




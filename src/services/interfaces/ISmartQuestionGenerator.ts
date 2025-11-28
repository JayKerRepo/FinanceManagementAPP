/**
 * ISmartQuestionGenerator Interface
 * 
 * Defines the contract for generating intelligent follow-up questions
 * that are specific, context-aware, and never repetitive.
 * 
 * @interface ISmartQuestionGenerator
 */

import { ExpenseDraft } from './IExpenseDraftManager'

export type PersonalityType = 'friendly' | 'professional' | 'analytical' | 'coaching'

export interface ISmartQuestionGenerator {
  /**
   * Generate a follow-up question for missing fields
   * @param missing - Array of missing field names
   * @param draft - Current expense draft
   * @param personality - Personality type for tone
   * @returns Specific question string (asks for ONE field at a time)
   */
  generateFollowUpQuestion(
    missing: string[],
    draft: ExpenseDraft,
    personality: PersonalityType
  ): string

  /**
   * Handle status questions like "are you done?", "is it complete?"
   * @param draft - Current expense draft
   * @param isSaved - Whether expense has been saved
   * @param personality - Personality type
   * @returns Appropriate response to status question
   */
  handleStatusQuestion(
    draft: ExpenseDraft,
    isSaved: boolean,
    personality: PersonalityType
  ): string

  /**
   * Generate question for a specific field
   * @param field - The field name to ask about
   * @param context - Additional context (draft, previous questions, etc.)
   * @param personality - Personality type
   * @returns Specific question for the field
   */
  getQuestionForField(
    field: string,
    context: any,
    personality: PersonalityType
  ): string

  /**
   * Determine if a follow-up question should be asked
   * @param draft - Current expense draft
   * @param required - Array of required fields
   * @returns True if follow-up is needed
   */
  shouldAskFollowUp(draft: ExpenseDraft, required: string[]): boolean

  /**
   * Check if a question has been asked before (to prevent repetition)
   * @param field - The field name
   * @param askedFields - Set of previously asked fields
   * @returns True if already asked
   */
  hasBeenAsked(field: string, askedFields: Set<string>): boolean
}







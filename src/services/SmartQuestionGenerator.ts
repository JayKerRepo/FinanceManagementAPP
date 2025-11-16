/**
 * SmartQuestionGenerator
 * 
 * Generates intelligent, context-aware follow-up questions that are:
 * - Specific (one field at a time)
 * - Never repetitive (tracks asked questions)
 * - Personality-appropriate (friendly, professional, analytical, coaching)
 * - Handles status questions ("are you done?", "is it complete?")
 * 
 * @class SmartQuestionGenerator
 * @implements {ISmartQuestionGenerator}
 */

import {
  ISmartQuestionGenerator,
  PersonalityType
} from './interfaces/ISmartQuestionGenerator'
import { ExpenseDraft } from './interfaces/IExpenseDraftManager'

export class SmartQuestionGenerator implements ISmartQuestionGenerator {
  // Field-specific question templates by personality
  private readonly questionTemplates: Record<
    PersonalityType,
    Record<string, string>
  > = {
    friendly: {
      amount: "What's the amount for this expense?",
      vendor: "Which vendor or merchant should I record this under?",
      category: "What category should this go under?",
      business: "Which business is this for?",
      date: "When was this expense?",
      payment_method: "How did you pay for this?",
      description: "Any additional notes or description?"
    },
    professional: {
      amount: "Please provide the expense amount.",
      vendor: "Please specify the vendor name.",
      category: "Please select a category.",
      business: "Please specify the business entity.",
      date: "Please provide the expense date.",
      payment_method: "Please specify the payment method.",
      description: "Any additional details?"
    },
    analytical: {
      amount: "I need the expense amount to proceed.",
      vendor: "I need the vendor name for categorization.",
      category: "I need the expense category for reporting.",
      business: "I need to know which business this expense belongs to.",
      date: "I need the expense date for accurate tracking.",
      payment_method: "I need the payment method for reconciliation.",
      description: "Any additional context for analysis?"
    },
    coaching: {
      amount: "Let's start with the amount. How much was this expense?",
      vendor: "Great! Now, which vendor or merchant was this from?",
      category: "Perfect! What category should we put this in?",
      business: "Which of your businesses should this expense go to?",
      date: "When did this expense occur?",
      payment_method: "How did you pay for this?",
      description: "Any notes that might help us track this better?"
    }
  }

  // Status question responses by personality
  private readonly statusResponses: Record<
    PersonalityType,
    {
      complete: string
      incomplete: (missing: string[]) => string
      saving: string
      saved: string
    }
  > = {
    friendly: {
      complete: "Almost done! Just saving it now...",
      incomplete: (missing) =>
        `Not quite yet! I still need ${missing[0]}. ${this.getQuestionForField(missing[0], {}, 'friendly')}`,
      saving: "Saving your expense now...",
      saved: "Yes! All done. I've saved your expense. Anything else?"
    },
    professional: {
      complete: "Processing final save...",
      incomplete: (missing) =>
        `Pending: ${missing[0]}. ${this.getQuestionForField(missing[0], {}, 'professional')}`,
      saving: "Saving expense to database...",
      saved: "Complete. Expense has been saved successfully."
    },
    analytical: {
      complete: "Finalizing expense entry...",
      incomplete: (missing) =>
        `Incomplete: Missing ${missing[0]}. ${this.getQuestionForField(missing[0], {}, 'analytical')}`,
      saving: "Committing expense to database...",
      saved: "Entry complete. Expense logged successfully."
    },
    coaching: {
      complete: "Great progress! Let me save this for you...",
      incomplete: (missing) =>
        `We're almost there! Just need ${missing[0]}. ${this.getQuestionForField(missing[0], {}, 'coaching')}`,
      saving: "Saving your expense...",
      saved: "Perfect! Your expense is all set. Want to add another?"
    }
  }

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
    personality: PersonalityType = 'friendly'
  ): string {
    if (missing.length === 0) {
      return "All set! Is there anything else you'd like to add?"
    }

    // Ask for the FIRST missing field only (one at a time)
    const fieldToAsk = missing[0]
    return this.getQuestionForField(fieldToAsk, { draft }, personality)
  }

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
    personality: PersonalityType = 'friendly'
  ): string {
    const responses = this.statusResponses[personality]

    if (isSaved) {
      return responses.saved
    }

    // Check if draft is complete (all required fields filled)
    const required = ['amount', 'vendor', 'category', 'business', 'date']
    const missing = required.filter(
      field => !draft[field as keyof ExpenseDraft] || draft[field as keyof ExpenseDraft] === ''
    )

    if (missing.length === 0) {
      // All fields filled but not saved yet
      return responses.saving
    }

    // Still missing fields
    return responses.incomplete(missing)
  }

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
    personality: PersonalityType = 'friendly'
  ): string {
    const templates = this.questionTemplates[personality]
    const question = templates[field as keyof typeof templates]

    if (question) {
      return question
    }

    // Fallback for unknown fields
    return `Please provide the ${field}.`
  }

  /**
   * Determine if a follow-up question should be asked
   * @param draft - Current expense draft
   * @param required - Array of required fields
   * @returns True if follow-up is needed
   */
  shouldAskFollowUp(draft: ExpenseDraft, required: string[]): boolean {
    const missing = required.filter(
      field => !draft[field as keyof ExpenseDraft] || draft[field as keyof ExpenseDraft] === ''
    )
    return missing.length > 0
  }

  /**
   * Check if a question has been asked before
   * @param field - The field name
   * @param askedFields - Set of previously asked fields
   * @returns True if already asked
   */
  hasBeenAsked(field: string, askedFields: Set<string>): boolean {
    return askedFields.has(field)
  }
}

// Export singleton instance for convenience
export const smartQuestionGenerator = new SmartQuestionGenerator()




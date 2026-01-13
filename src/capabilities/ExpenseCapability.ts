/**
 * ExpenseCapability
 * 
 * Handles expense-related operations (entry, queries, corrections).
 * Used by both voice and chat agents for feature parity.
 * 
 * @class ExpenseCapability
 * @implements {IBaseCapability}
 */

import { IBaseCapability, AgentAction, CapabilityContext } from './BaseCapability'
import { ExpenseDraftManager } from '../services/ExpenseDraftManager'
import { smartQuestionGenerator } from '../services/SmartQuestionGenerator'
import { businessVendorDetector } from '../lib/businessVendorDetector'
import { categoryInferrer } from '../lib/categoryInferrer'
import { dateParser } from '../lib/dateParser'
import { multiItemParser } from '../lib/multiItemParser'
import { bulkExpenseParser } from '../lib/bulkExpenseParser'
import { ExpenseDraft } from '../services/interfaces/IExpenseDraftManager'

export class ExpenseCapability implements IBaseCapability {
  private draftManager: ExpenseDraftManager
  private requiredFields = ['amount', 'vendor', 'category', 'business', 'date']

  constructor() {
    this.draftManager = new ExpenseDraftManager()
  }

  /**
   * Get capability name
   */
  getName(): string {
    return 'expense'
  }

  /**
   * Check if capability can handle the input
   */
  canHandle(input: string): boolean {
    const lowerInput = input.toLowerCase()
    const expenseKeywords = [
      'expense', 'spent', 'bought', 'paid', 'purchase', 'add expense',
      'log expense', 'record expense'
    ]
    return expenseKeywords.some(keyword => lowerInput.includes(keyword))
  }

  /**
   * Handle expense operation
   */
  async handle(input: string, context: CapabilityContext): Promise<AgentAction> {
    // Check for multi-item or bulk expenses
    const multiItem = multiItemParser.parse(input)
    if (multiItem) {
      return this.handleMultiItem(multiItem, context)
    }

    const bulkExpense = bulkExpenseParser.parse(input)
    if (bulkExpense) {
      return this.handleBulkExpense(bulkExpense, context)
    }

    // Regular single expense
    return this.handleSingleExpense(input, context)
  }

  /**
   * Handle single expense entry
   */
  private async handleSingleExpense(
    input: string,
    context: CapabilityContext
  ): Promise<AgentAction> {
    // Call extract-expense API
    const response = await fetch('/api/voice/extract-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input,
        businessId: context.businessId,
        businesses: context.businesses || [],
        context: {
          conversationHistory: context.conversationHistory,
          draft: context.draft,
          collectedData: context.draft
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to extract expense')
    }

    const result = await response.json()

    // Update draft manager
    if (result.draft) {
      Object.entries(result.draft).forEach(([field, value]) => {
        if (value !== null && value !== undefined) {
          this.draftManager.updateField(field as keyof ExpenseDraft, value)
        }
      })
    }

    // Check if complete
    const missing = this.draftManager.getMissingFields(this.requiredFields)

    if (missing.length === 0) {
      // Complete - ready to save
      const draft = this.draftManager.getDraft()
      return {
        action: 'create_expense',
        data: draft,
        assistant_message: result.assistant_message || "Perfect! I have all the information. Saving your expense now..."
      }
    }

    // Missing fields - ask follow-up
    const question = smartQuestionGenerator.generateFollowUpQuestion(
      missing,
      this.draftManager.getDraft(),
      context.personality || 'friendly'
    )

    return {
      action: 'request_more_info',
      missing: [missing[0]], // Only first missing field
      assistant_message: question
    }
  }

  /**
   * Handle multi-item expense
   */
  private async handleMultiItem(
    multiItem: any,
    context: CapabilityContext
  ): Promise<AgentAction> {
    // For now, return interpret action with multi-item data
    // Full implementation would process each item
    return {
      action: 'interpret',
      draft: {} as ExpenseDraft,
      needs_followup: [],
      assistant_message: `I found ${multiItem.items.length} expenses. Let me process them...`
    }
  }

  /**
   * Handle bulk expense
   */
  private async handleBulkExpense(
    bulkExpense: any,
    context: CapabilityContext
  ): Promise<AgentAction> {
    return {
      action: 'interpret',
      draft: {} as ExpenseDraft,
      needs_followup: [],
      assistant_message: `I found ${bulkExpense.expenses.length} expenses from ${bulkExpense.eventName || 'this event'}. Let me process them...`
    }
  }

  /**
   * Get current draft
   */
  getDraft(): ExpenseDraft {
    return this.draftManager.getDraft()
  }

  /**
   * Reset draft
   */
  reset(): void {
    this.draftManager.reset()
  }
}

// Export singleton instance
export const expenseCapability = new ExpenseCapability()







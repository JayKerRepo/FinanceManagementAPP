/**
 * BulkExpenseParser
 * 
 * Parses bulk expenses from events like trips, purchases, etc.
 * Example: "I have several expenses from my trip: $120 for hotel, $45 for meals, $89 for parking"
 * 
 * @class BulkExpenseParser
 */

import { ExpenseDraft } from '../services/interfaces/IExpenseDraftManager'

export type EventType = 'trip' | 'purchase' | 'monthly' | 'custom'

export interface BulkExpenseDraft {
  expenses: ExpenseDraft[]
  eventType: EventType
  eventName?: string
  totalAmount: number
  date?: string
}

export class BulkExpenseParser {
  /**
   * Parse bulk expenses from text
   * @param text - User input text
   * @returns BulkExpenseDraft or null if not bulk expense
   */
  parse(text: string): BulkExpenseDraft | null {
    const lowerText = text.toLowerCase()

    // Detect event type
    let eventType: EventType = 'custom'
    if (lowerText.includes('trip') || lowerText.includes('travel')) {
      eventType = 'trip'
    } else if (lowerText.includes('purchase') || lowerText.includes('bought')) {
      eventType = 'purchase'
    } else if (lowerText.includes('monthly') || lowerText.includes('this month')) {
      eventType = 'monthly'
    }

    // Extract event name
    const eventName = this.extractEventName(text, eventType)

    // Extract individual expenses (simplified - would use GPT-5 nano for better parsing)
    const expenses = this.extractExpenses(text)

    if (expenses.length === 0) {
      return null
    }

    const totalAmount = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    )

    return {
      expenses,
      eventType,
      eventName,
      totalAmount,
      date: this.extractDate(text)
    }
  }

  /**
   * Extract event name from text
   * @param text - Full text
   * @param eventType - Detected event type
   * @returns Event name or undefined
   */
  private extractEventName(text: string, eventType: EventType): string | undefined {
    const patterns = [
      /(?:from|for)\s+(?:my|the|a)\s+([^:]+?)(?:\s*:)/i,
      /(?:trip|purchase|expense)\s+(?:to|in|at)\s+([^:]+)/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Default names by event type
    const defaultNames: Record<EventType, string> = {
      trip: 'Business Trip',
      purchase: 'Purchase',
      monthly: 'Monthly Expenses',
      custom: 'Expenses'
    }

    return defaultNames[eventType]
  }

  /**
   * Extract individual expenses from text
   * @param text - Full text
   * @returns Array of expense drafts
   */
  private extractExpenses(text: string): ExpenseDraft[] {
    const expenses: ExpenseDraft[] = []

    // Pattern: "$X for Y" or "$X Y"
    const expensePattern = /\$?(\d+\.?\d*)\s+(?:for\s+)?([^,]+?)(?:,|\s+and\s+|$)/gi
    let match

    while ((match = expensePattern.exec(text)) !== null) {
      const amount = parseFloat(match[1])
      const description = match[2].trim()

      if (amount && description) {
        expenses.push({
          amount,
          description,
          vendor: null,
          category: null,
          business: null,
          date: null,
          payment_method: null
        })
      }
    }

    return expenses
  }

  /**
   * Extract date from text
   * @param text - Full text
   * @returns ISO date string or undefined
   */
  private extractDate(text: string): string | undefined {
    // Use dateParser for date extraction
    // For now, return undefined (defaults to today)
    return undefined
  }

  /**
   * Check if text contains bulk expenses
   * @param text - User input text
   * @returns True if likely bulk expense
   */
  isBulkExpense(text: string): boolean {
    const bulkKeywords = [
      'several expenses',
      'multiple expenses',
      'expenses from',
      'trip expenses',
      'all expenses'
    ]

    return bulkKeywords.some(keyword => text.toLowerCase().includes(keyword))
  }
}

// Export singleton instance
export const bulkExpenseParser = new BulkExpenseParser()


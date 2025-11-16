/**
 * MultiItemParser
 * 
 * Parses multi-item expenses from single input.
 * Example: "I bought $89 for printer paper, $45 for pens, and $120 for a new monitor"
 * 
 * @class MultiItemParser
 */

import { ExpenseDraft } from '../services/interfaces/IExpenseDraftManager'

export interface MultiItemExpense {
  items: ExpenseDraft[]
  total: number
  groupName?: string
  groupCategory?: string
}

export class MultiItemParser {
  /**
   * Parse multi-item expense from text
   * @param text - User input text
   * @returns MultiItemExpense or null if not multi-item
   */
  parse(text: string): MultiItemExpense | null {
    // Detect multi-item patterns
    // Pattern 1: "I bought X for Y, Z for W, and A for B"
    // Pattern 2: "Add expenses: $50 for gas, $30 for lunch, $20 for parking"
    // Pattern 3: "I have several expenses: $120 hotel, $45 meals, $89 parking"

    const multiItemPatterns = [
      // Pattern: "$X for Y, $Z for W"
      /\$?(\d+\.?\d*)\s+for\s+([^,]+)(?:,\s+|\s+and\s+)\$?(\d+\.?\d*)\s+for\s+([^,]+)/i,
      // Pattern: "$X Y, $Z W"
      /\$?(\d+\.?\d*)\s+([^,]+)(?:,\s+|\s+and\s+)\$?(\d+\.?\d*)\s+([^,]+)/i,
      // Pattern: "X for Y, Z for W, and A for B"
      /(\d+\.?\d*)\s+for\s+([^,]+)(?:,\s+|\s+and\s+)(\d+\.?\d*)\s+for\s+([^,]+)/i
    ]

    for (const pattern of multiItemPatterns) {
      const match = text.match(pattern)
      if (match) {
        return this.extractMultiItems(text, match)
      }
    }

    // Check for explicit multi-item keywords
    const multiItemKeywords = [
      'several expenses',
      'multiple expenses',
      'bought',
      'purchased',
      'expenses from'
    ]

    const hasMultiItemKeyword = multiItemKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    )

    if (hasMultiItemKeyword) {
      return this.extractFromKeywords(text)
    }

    return null
  }

  /**
   * Extract multi-items from matched pattern
   * @param text - Full text
   * @param match - Regex match result
   * @returns MultiItemExpense
   */
  private extractMultiItems(text: string, match: RegExpMatchArray): MultiItemExpense {
    const items: ExpenseDraft[] = []

    // Extract amounts and descriptions
    // This is a simplified parser - could be enhanced with GPT-5 nano for better accuracy
    const amounts = text.match(/\$?(\d+\.?\d*)/g) || []
    const descriptions = text.split(/\$?\d+\.?\d*/).filter(d => d.trim())

    // Create expense items
    for (let i = 0; i < Math.min(amounts.length, descriptions.length); i++) {
      const amount = parseFloat(amounts[i].replace('$', ''))
      const description = descriptions[i + 1]?.trim() || ''

      if (amount && description) {
        items.push({
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

    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      items,
      total,
      groupName: this.extractGroupName(text),
      groupCategory: undefined
    }
  }

  /**
   * Extract multi-items from keywords
   * @param text - Full text
   * @returns MultiItemExpense
   */
  private extractFromKeywords(text: string): MultiItemExpense {
    // Use GPT-5 nano for better parsing if available
    // For now, return null to indicate needs AI processing
    return null as any
  }

  /**
   * Extract group name from text (e.g., "business trip", "office supplies")
   * @param text - Full text
   * @returns Group name or undefined
   */
  private extractGroupName(text: string): string | undefined {
    const groupPatterns = [
      /(?:from|for)\s+(?:my|the|a)\s+([^,]+?)(?:\s+expense|$)/i,
      /(?:trip|purchase|expense|supplies)\s+(?:from|for)\s+([^,]+)/i
    ]

    for (const pattern of groupPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return undefined
  }

  /**
   * Check if text contains multi-item expense
   * @param text - User input text
   * @returns True if likely multi-item
   */
  isMultiItem(text: string): boolean {
    return this.parse(text) !== null
  }
}

// Export singleton instance
export const multiItemParser = new MultiItemParser()


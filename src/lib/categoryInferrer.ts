/**
 * CategoryInferrer
 * 
 * Intelligently infers expense category from vendor name and context keywords.
 * Reduces need to ask user for category when it can be determined.
 * 
 * @class CategoryInferrer
 */

export type ExpenseCategory =
  | 'Office & Admin'
  | 'Marketing'
  | 'Travel & Meals'
  | 'Software'
  | 'Equipment'
  | 'Utilities'
  | 'Professional Services'
  | 'Other'

export class CategoryInferrer {
  // Category keywords mapping
  private readonly categoryKeywords: Record<ExpenseCategory, string[]> = {
    'Travel & Meals': [
      'gas', 'fuel', 'restaurant', 'lunch', 'dinner', 'coffee', 'starbucks',
      'uber', 'lyft', 'hotel', 'flight', 'travel', 'airline', 'delta',
      'united', 'american', 'southwest', 'hilton', 'marriott', 'airbnb',
      'booking', 'expedia', 'mcdonalds', 'subway', 'chipotle', 'panera'
    ],
    'Office & Admin': [
      'office', 'supplies', 'paper', 'printer', 'staples', 'rent',
      'utilities', 'walmart', 'target', 'costco', 'home depot', 'lowes',
      'office depot', 'stationery', 'pens', 'pencils'
    ],
    'Marketing': [
      'advertising', 'ads', 'marketing', 'facebook', 'google ads', 'meta',
      'instagram', 'twitter', 'linkedin', 'campaign', 'promotion'
    ],
    'Software': [
      'software', 'subscription', 'saas', 'license', 'app', 'tool',
      'microsoft', 'apple', 'adobe', 'salesforce', 'shopify', 'slack',
      'zoom', 'netflix', 'spotify', 'twilio', 'sendgrid', 'mailchimp'
    ],
    'Equipment': [
      'computer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse',
      'printer', 'scanner', 'equipment', 'hardware', 'device'
    ],
    'Utilities': [
      'electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att',
      'tmobile', 'sprint', 'comcast', 'spectrum', 'cox', 'utility'
    ],
    'Professional Services': [
      'consulting', 'legal', 'accounting', 'lawyer', 'attorney', 'cpa',
      'bookkeeping', 'audit', 'professional', 'service'
    ],
    'Other': []
  }

  // Vendor-to-category mapping for common vendors
  private readonly vendorCategoryMap: Record<string, ExpenseCategory> = {
    'starbucks': 'Travel & Meals',
    'mcdonalds': 'Travel & Meals',
    'uber': 'Travel & Meals',
    'lyft': 'Travel & Meals',
    'delta': 'Travel & Meals',
    'united': 'Travel & Meals',
    'hilton': 'Travel & Meals',
    'marriott': 'Travel & Meals',
    'shell': 'Travel & Meals',
    'chevron': 'Travel & Meals',
    'meta': 'Marketing',
    'facebook': 'Marketing',
    'google': 'Marketing',
    'microsoft': 'Software',
    'adobe': 'Software',
    'salesforce': 'Software',
    'slack': 'Software',
    'zoom': 'Software',
    'verizon': 'Utilities',
    'att': 'Utilities',
    'comcast': 'Utilities'
  }

  /**
   * Infer category from vendor name and text context
   * @param vendor - Vendor name (optional)
   * @param text - Full text context (optional)
   * @returns Inferred category or null if ambiguous
   */
  infer(vendor?: string | null, text?: string | null): ExpenseCategory | null {
    const searchText = `${vendor || ''} ${text || ''}`.toLowerCase()

    // First check vendor-specific mapping
    if (vendor) {
      const vendorLower = vendor.toLowerCase()
      const directMatch = this.vendorCategoryMap[vendorLower]
      if (directMatch) {
        return directMatch
      }
    }

    // Score each category based on keyword matches
    const categoryScores: Record<ExpenseCategory, number> = {
      'Travel & Meals': 0,
      'Office & Admin': 0,
      'Marketing': 0,
      'Software': 0,
      'Equipment': 0,
      'Utilities': 0,
      'Professional Services': 0,
      'Other': 0
    }

    // Count keyword matches for each category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => searchText.includes(keyword))
      categoryScores[category as ExpenseCategory] = matches.length
    }

    // Find category with highest score
    const maxScore = Math.max(...Object.values(categoryScores))

    // If no clear winner (score is 0 or tie), return null (ambiguous)
    if (maxScore === 0) {
      return null
    }

    // Check for ties (ambiguous)
    const winners = Object.entries(categoryScores).filter(
      ([, score]) => score === maxScore
    )

    if (winners.length > 1) {
      // Multiple categories tied, return null (ambiguous)
      return null
    }

    // Return winning category
    return winners[0][0] as ExpenseCategory
  }

  /**
   * Check if category is ambiguous (needs user input)
   * @param vendor - Vendor name
   * @param text - Full text context
   * @returns True if category is ambiguous
   */
  isAmbiguous(vendor?: string | null, text?: string | null): boolean {
    return this.infer(vendor, text) === null
  }
}

// Export singleton instance
export const categoryInferrer = new CategoryInferrer()







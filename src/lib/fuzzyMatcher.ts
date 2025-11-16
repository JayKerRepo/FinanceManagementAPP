/**
 * FuzzyMatcher
 * 
 * Implements fuzzy string matching using Levenshtein distance algorithm
 * to handle typos, variations, and mispronunciations in vendor and business names.
 * 
 * Examples:
 * - "Sonsta" → "Sonesta" (typo correction)
 * - "Marriot" → "Marriott" (missing letter)
 * - "ABC" → "ABC Company" (abbreviation expansion)
 * 
 * @class FuzzyMatcher
 * @implements {IFuzzyMatcher}
 */

import { IFuzzyMatcher, MatchResult } from '../services/interfaces/IFuzzyMatcher'

export class FuzzyMatcher implements IFuzzyMatcher {
  private readonly defaultThreshold = 0.7 // 70% similarity required

  /**
   * Normalize string for comparison (lowercase, remove special chars)
   * @param str - String to normalize
   * @returns Normalized string
   */
  normalize(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance (number of changes needed)
   */
  levenshteinDistance(str1: string, str2: string): number {
    const s1 = this.normalize(str1)
    const s2 = this.normalize(str2)

    const len1 = s1.length
    const len2 = s2.length

    // Create matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0))

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }

    return matrix[len1][len2]
  }

  /**
   * Calculate similarity between two strings (0-1, where 1 is identical)
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score
   */
  calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)

    if (maxLength === 0) {
      return 1.0
    }

    return 1 - distance / maxLength
  }

  /**
   * Find best matching vendor from known vendors
   * @param input - User input (may contain typos)
   * @param knownVendors - Array of known vendor names
   * @param threshold - Minimum similarity threshold (0-1), defaults to 0.7
   * @returns Match result or null if no good match found
   */
  fuzzyMatchVendor(
    input: string,
    knownVendors: string[],
    threshold: number = this.defaultThreshold
  ): MatchResult | null {
    if (!input || knownVendors.length === 0) {
      return null
    }

    let bestMatch: MatchResult | null = null
    let bestSimilarity = 0

    for (const vendor of knownVendors) {
      const similarity = this.calculateSimilarity(input, vendor)

      if (similarity >= threshold && similarity > bestSimilarity) {
        const distance = this.levenshteinDistance(input, vendor)
        bestMatch = {
          match: vendor,
          confidence: similarity,
          similarity: similarity,
          distance: distance
        }
        bestSimilarity = similarity
      }
    }

    return bestMatch
  }

  /**
   * Find best matching business name with fuzzy matching
   * @param input - User input business name
   * @param businesses - Array of business objects
   * @param threshold - Minimum similarity threshold
   * @returns Best match or null
   */
  fuzzyMatchBusiness(
    input: string,
    businesses: Array<{ id: string; name: string }>,
    threshold: number = this.defaultThreshold
  ): { business: { id: string; name: string }; confidence: number; similarity: number } | null {
    if (!input || businesses.length === 0) {
      return null
    }

    let bestMatch: { business: { id: string; name: string }; confidence: number; similarity: number } | null = null
    let bestSimilarity = 0

    for (const business of businesses) {
      const similarity = this.calculateSimilarity(input, business.name)

      if (similarity >= threshold && similarity > bestSimilarity) {
        bestMatch = {
          business,
          confidence: similarity,
          similarity: similarity
        }
        bestSimilarity = similarity
      }
    }

    return bestMatch
  }
}

// Export singleton instance for convenience
export const fuzzyMatcher = new FuzzyMatcher()




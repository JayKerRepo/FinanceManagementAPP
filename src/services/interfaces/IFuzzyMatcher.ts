/**
 * IFuzzyMatcher Interface
 * 
 * Defines the contract for fuzzy string matching to handle typos,
 * variations, and mispronunciations in vendor and business names.
 * 
 * @interface IFuzzyMatcher
 */

export interface MatchResult {
  match: string
  confidence: number
  similarity: number
  distance: number
}

export interface IFuzzyMatcher {
  /**
   * Find best matching vendor from known vendors
   * @param input - User input (may contain typos)
   * @param knownVendors - Array of known vendor names
   * @param threshold - Minimum similarity threshold (0-1)
   * @returns Match result or null if no good match found
   */
  fuzzyMatchVendor(
    input: string,
    knownVendors: string[],
    threshold?: number
  ): MatchResult | null

  /**
   * Calculate similarity between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1, where 1 is identical)
   */
  calculateSimilarity(str1: string, str2: string): number

  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance (number of changes needed)
   */
  levenshteinDistance(str1: string, str2: string): number

  /**
   * Normalize string for comparison (lowercase, remove special chars)
   * @param str - String to normalize
   * @returns Normalized string
   */
  normalize(str: string): string
}






/**
 * BusinessVendorDetector
 * 
 * Distinguishes between vendors (hotels, stores, restaurants) and businesses,
 * with fuzzy matching for business names. Critical for preventing misclassification.
 * 
 * Rules:
 * - Hotels, gas stations, restaurants, airlines, stores = vendors
 * - Only classify as business if explicitly matches user's business list
 * - Use fuzzy matching for business name variations (ABC, A.B.C., ABC Company)
 * 
 * @class BusinessVendorDetector
 * @implements {IBusinessVendorDetector}
 */

import {
  IBusinessVendorDetector,
  Business,
  BusinessMatch,
  DetectionResult
} from '../services/interfaces/IBusinessVendorDetector'
import { fuzzyMatcher } from './fuzzyMatcher'

export class BusinessVendorDetector implements IBusinessVendorDetector {
  // Common vendor patterns (hotels, stores, restaurants, etc.)
  private readonly vendorKeywords = [
    // Hotels
    'hotel', 'marriott', 'hilton', 'hyatt', 'sheraton', 'westin', 'radisson',
    'holiday inn', 'best western', 'motel', 'inn', 'resort', 'lodge',
    'sonesta', 'embassy', 'courtyard', 'hampton', 'doubletree',
    
    // Gas Stations
    'shell', 'chevron', 'exxon', 'mobil', 'bp', 'texaco', 'arco', 'valero',
    'citgo', 'sunoco', 'phillips 66', 'conoco',
    
    // Restaurants
    'starbucks', 'mcdonalds', 'burger king', 'subway', 'pizza hut', 'dominos',
    'chipotle', 'panera', 'taco bell', 'kfc', 'wendys', 'dunkin',
    
    // Airlines
    'delta', 'united', 'american', 'southwest', 'jetblue', 'alaska',
    'spirit', 'frontier', 'allegiant',
    
    // Stores
    'walmart', 'target', 'costco', 'home depot', 'lowes', 'staples',
    'office depot', 'best buy', 'amazon', 'whole foods', 'safeway',
    
    // Tech/Services
    'uber', 'lyft', 'airbnb', 'booking', 'expedia', 'priceline',
    'meta', 'facebook', 'google', 'microsoft', 'apple', 'adobe'
  ]

  /**
   * Check if a name is a vendor (hotel, store, restaurant, etc.)
   * @param name - The name to check
   * @returns True if name matches vendor patterns
   */
  isVendor(name: string): boolean {
    if (!name) return false

    const normalized = name.toLowerCase().trim()

    // Check against vendor keywords
    return this.vendorKeywords.some(keyword => normalized.includes(keyword))
  }

  /**
   * Find business using fuzzy matching
   * @param name - The business name to find
   * @param businesses - List of user's businesses
   * @returns Business match with confidence score, or null if not found
   */
  findBusiness(name: string, businesses: Business[]): BusinessMatch | null {
    if (!name || businesses.length === 0) {
      return null
    }

    // First try exact match (case-insensitive)
    const exactMatch = businesses.find(
      b => b.name.toLowerCase() === name.toLowerCase()
    )
    if (exactMatch) {
      return {
        business: exactMatch,
        confidence: 1.0,
        similarity: 1.0
      }
    }

    // Try fuzzy matching
    const fuzzyResult = fuzzyMatcher.fuzzyMatchBusiness(name, businesses, 0.7)
    if (fuzzyResult) {
      return {
        business: fuzzyResult.business,
        confidence: fuzzyResult.confidence,
        similarity: fuzzyResult.similarity
      }
    }

    return null
  }

  /**
   * Determine if system should ask about business selection
   * @param name - The name mentioned by user
   * @param businesses - List of user's businesses
   * @param currentBusiness - Currently selected business (optional)
   * @returns True if should ask about business
   */
  shouldAskAboutBusiness(
    name: string,
    businesses: Business[],
    currentBusiness?: Business | null
  ): boolean {
    // If current business is set, don't ask unless user explicitly mentions different business
    if (currentBusiness) {
      const match = this.findBusiness(name, businesses)
      // Only ask if user mentioned a different business
      return match !== null && match.business.id !== currentBusiness.id
    }

    // If no current business, check if name is a business or vendor
    if (this.isVendor(name)) {
      // It's a vendor, don't ask about business
      return false
    }

    // Check if it matches a business
    const match = this.findBusiness(name, businesses)
    if (match && match.confidence >= 0.8) {
      // High confidence match, don't ask
      return false
    }

    // Low confidence or no match, ask if it's not clearly a vendor
    return !this.isVendor(name)
  }

  /**
   * Detect if name is vendor or business
   * @param name - The name to detect
   * @param businesses - List of user's businesses
   * @param currentBusiness - Currently selected business (optional)
   * @returns Detection result with type and confidence
   */
  detect(
    name: string,
    businesses: Business[],
    currentBusiness?: Business | null
  ): DetectionResult {
    if (!name) {
      return {
        type: 'unknown',
        confidence: 0
      }
    }

    // Check if it's a vendor first
    if (this.isVendor(name)) {
      return {
        type: 'vendor',
        vendorName: name,
        confidence: 0.9
      }
    }

    // Try to find as business
    const businessMatch = this.findBusiness(name, businesses)
    if (businessMatch && businessMatch.confidence >= 0.7) {
      return {
        type: 'business',
        business: businessMatch,
        confidence: businessMatch.confidence
      }
    }

    // Unknown - could be either, but default to vendor if it sounds like one
    const soundsLikeVendor = this.isVendor(name)
    return {
      type: soundsLikeVendor ? 'vendor' : 'unknown',
      vendorName: soundsLikeVendor ? name : undefined,
      confidence: 0.5
    }
  }
}

// Export singleton instance for convenience
export const businessVendorDetector = new BusinessVendorDetector()







/**
 * IBusinessVendorDetector Interface
 * 
 * Defines the contract for distinguishing between vendors and businesses,
 * with fuzzy matching capabilities for business names.
 * 
 * @interface IBusinessVendorDetector
 */

export interface Business {
  id: string
  name: string
}

export interface BusinessMatch {
  business: Business
  confidence: number
  similarity: number
}

export interface DetectionResult {
  type: 'vendor' | 'business' | 'unknown'
  business?: BusinessMatch | null
  vendorName?: string
  confidence: number
}

export interface IBusinessVendorDetector {
  /**
   * Check if a name is a vendor (hotel, store, restaurant, etc.)
   * @param name - The name to check
   * @returns True if name matches vendor patterns
   */
  isVendor(name: string): boolean

  /**
   * Find business using fuzzy matching
   * @param name - The business name to find
   * @param businesses - List of user's businesses
   * @returns Business match with confidence score, or null if not found
   */
  findBusiness(name: string, businesses: Business[]): BusinessMatch | null

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
  ): boolean

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
  ): DetectionResult
}







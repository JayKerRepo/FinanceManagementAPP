/**
 * VendorDictionary
 * 
 * Maintains a session-based dictionary of recognized vendors with fuzzy matching
 * and ASR error correction. Prevents repeated vendor extraction failures.
 * 
 * Implements vendor memory as recommended in Master System Prompt.
 * 
 * @class VendorDictionary
 */

import { fuzzyMatcher } from '../lib/fuzzyMatcher'

interface VendorEntry {
  name: string
  normalizedName: string
  category?: string
  confidence: number
  lastUsed: number
  useCount: number
}

export class VendorDictionary {
  private vendors: Map<string, VendorEntry> = new Map()
  private readonly maxVendors = 100 // Limit dictionary size
  private readonly confidenceThreshold = 0.7

  // Common vendor patterns with ASR error corrections and categories
  private readonly commonVendors = [
    // Hotels (Travel category)
    { name: 'Marriott', category: 'Travel', variations: ['marriot', 'marriot hotel', 'marriott hotel', 'marriot hotel', 'wender marriott', 'vendor marriott'] },
    { name: 'Hilton', category: 'Travel', variations: ['hilton', 'hilton hotel', 'hilton hotel'] },
    { name: 'Sonesta', category: 'Travel', variations: ['sonesta', 'sonesta hotel', 'sonsta', 'sonsa', 'ssnota'] },
    { name: 'Hyatt', category: 'Travel', variations: ['hyatt', 'hyatt hotel'] },
    { name: 'Sheraton', category: 'Travel', variations: ['sheraton', 'sheraton hotel'] },
    { name: 'Westin', category: 'Travel', variations: ['westin', 'westin hotel'] },
    { name: 'Holiday Inn', category: 'Travel', variations: ['holiday inn', 'holiday inn hotel'] },
    
    // Gas Stations (Fuel category)
    { name: 'Shell', category: 'Fuel', variations: ['shell', 'shell gas', 'shell station'] },
    { name: 'Chevron', category: 'Fuel', variations: ['chevron', 'chevron gas', 'chevron station'] },
    { name: 'Exxon', category: 'Fuel', variations: ['exxon', 'exxon mobil', 'exxon gas'] },
    { name: 'BP', category: 'Fuel', variations: ['bp', 'bp gas', 'bp station'] },
    
    // Restaurants (Meals category)
    { name: 'Starbucks', category: 'Meals', variations: ['starbucks', 'starbucks coffee'] },
    { name: 'McDonald\'s', category: 'Meals', variations: ['mcdonalds', 'mcdonald', 'mcd'] },
    { name: 'Subway', category: 'Meals', variations: ['subway', 'subway restaurant'] },
    
    // Airlines (Travel category)
    { name: 'Delta', category: 'Travel', variations: ['delta', 'delta airlines', 'delta air'] },
    { name: 'United', category: 'Travel', variations: ['united', 'united airlines', 'united air'] },
    { name: 'American Airlines', category: 'Travel', variations: ['american', 'american airlines', 'american air'] },
    { name: 'Southwest', category: 'Travel', variations: ['southwest', 'southwest airlines'] },
    
    // Tech/Services (Transportation/Software categories)
    { name: 'Uber', category: 'Transportation', variations: ['uber', 'uber ride'] },
    { name: 'Lyft', category: 'Transportation', variations: ['lyft', 'lyft ride'] },
    { name: 'Amazon', category: 'Office & Admin', variations: ['amazon', 'amazon.com'] },
  ]

  constructor() {
    // Initialize with common vendors
    this.commonVendors.forEach(vendor => {
      this.addVendor(vendor.name, 0.9, vendor.category)
      // Add variations
      vendor.variations.forEach(variation => {
        this.vendors.set(variation.toLowerCase(), {
          name: vendor.name,
          normalizedName: this.normalize(vendor.name),
          category: vendor.category,
          confidence: 0.85,
          lastUsed: Date.now(),
          useCount: 0
        })
      })
    })
  }

  /**
   * Normalize vendor name for matching
   */
  private normalize(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
  }

  /**
   * Add vendor to dictionary
   */
  addVendor(name: string, confidence: number = 0.8, category?: string): void {
    const normalized = this.normalize(name)
    
    // Check if already exists
    const existing = this.vendors.get(normalized)
    if (existing) {
      existing.useCount++
      existing.lastUsed = Date.now()
      existing.confidence = Math.max(existing.confidence, confidence)
      if (category) existing.category = category
      return
    }

    // Add new vendor
    this.vendors.set(normalized, {
      name,
      normalizedName: normalized,
      category,
      confidence,
      lastUsed: Date.now(),
      useCount: 1
    })

    // Limit dictionary size (remove least recently used)
    if (this.vendors.size > this.maxVendors) {
      const entries = Array.from(this.vendors.entries())
      entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed)
      this.vendors.delete(entries[0][0])
    }
  }

  /**
   * Find vendor using fuzzy matching and ASR error correction
   */
  findVendor(input: string): { name: string; confidence: number } | null {
    if (!input || input.trim().length === 0) {
      return null
    }

    const normalizedInput = this.normalize(input)

    // First, try exact match (case-insensitive)
    const exactMatch = this.vendors.get(normalizedInput)
    if (exactMatch) {
      exactMatch.useCount++
      exactMatch.lastUsed = Date.now()
      return { name: exactMatch.name, confidence: exactMatch.confidence }
    }

    // Try fuzzy matching against all vendors
    const vendorNames = Array.from(this.vendors.values()).map(v => v.name)
    const fuzzyMatch = fuzzyMatcher.fuzzyMatchVendor(normalizedInput, vendorNames, this.confidenceThreshold)
    
    if (fuzzyMatch) {
      // Add to dictionary for future use
      this.addVendor(fuzzyMatch.match, fuzzyMatch.confidence)
      return { name: fuzzyMatch.match, confidence: fuzzyMatch.confidence }
    }

    // Handle common ASR errors
    // "Wender" or "Vendor" followed by actual vendor name
    if (/wender|vendor/i.test(normalizedInput)) {
      // Try to extract vendor name from context (would need to be passed separately)
      // For now, return null and let post-processing handle it
      return null
    }

    return null
  }

  /**
   * Get all vendors sorted by usage
   */
  getPopularVendors(limit: number = 10): string[] {
    const entries = Array.from(this.vendors.values())
    entries.sort((a, b) => b.useCount - a.useCount)
    return entries.slice(0, limit).map(v => v.name)
  }

  /**
   * Clear dictionary (for new session)
   */
  clear(): void {
    this.vendors.clear()
    // Re-initialize with common vendors
    this.commonVendors.forEach(vendor => {
      this.addVendor(vendor.name, 0.9)
    })
  }

  /**
   * Get vendor category if known
   */
  getCategory(vendorName: string): string | null {
    const normalized = this.normalize(vendorName)
    const entry = this.vendors.get(normalized)
    return entry?.category || null
  }
}

// Export singleton instance
export const vendorDictionary = new VendorDictionary()


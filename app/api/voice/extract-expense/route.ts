/**
 * Voice Extract Expense API Route
 * 
 * Extracts expense information from voice/text input with optimized token usage.
 * Uses MASTER SYSTEM PROMPT for expense extraction.
 * Returns action-based JSON format.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getMasterSystemPrompt } from '../../../../src/lib/prompts/systemPrompts'
import { tokenOptimizer } from '../../../../src/services/TokenOptimizer'
import { businessVendorDetector } from '../../../../src/lib/businessVendorDetector'
import { fuzzyMatcher } from '../../../../src/lib/fuzzyMatcher'
import { categoryInferrer } from '../../../../src/lib/categoryInferrer'
import { dateParser } from '../../../../src/lib/dateParser'
import { vendorDictionary } from '../../../../src/services/VendorDictionary'
import type { ExpenseDraft } from '../../../../src/services/interfaces/IExpenseDraftManager'

interface ExpenseExtractionRequest {
  text: string
  businessId?: string
  context?: {
    previousExpenses?: any[]
    userPreferences?: any
    conversationHistory?: Array<{ role: string; content: string }>
    collectedData?: Record<string, any>
    currentIntent?: string
    draft?: ExpenseDraft
  }
  businesses?: Array<{ id: string; name: string }>
}

interface ExtractionResponse {
  action: 'interpret' | 'request_more_info' | 'create_expense' | 'update_draft'
  draft: ExpenseDraft
  missing?: string[]
  needs_followup?: string[]
  assistant_message: string
  confidence?: number
}

export async function POST(request: NextRequest) {
  try {
    const { text, businessId, context, businesses = [] }: ExpenseExtractionRequest = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for extraction' },
        { status: 400 }
      )
    }

    // Get optimized system prompt
    const systemPrompt = getMasterSystemPrompt()

    // Build optimized user prompt with context
    let userPrompt = `Extract expense information from: "${text}"`

    // Add conversation context (increased from 3 to 10 for better context)
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      const limitedHistory = tokenOptimizer.limitHistory(context.conversationHistory, 10)
      userPrompt += `\n\nRecent conversation:\n${limitedHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
    }

    // Add existing draft if available
    if (context?.draft) {
      userPrompt += `\n\nCurrent draft: ${JSON.stringify(context.draft)}`
    }

    // Add collected data
    if (context?.collectedData && Object.keys(context.collectedData).length > 0) {
      userPrompt += `\n\nPreviously collected: ${JSON.stringify(context.collectedData)}`
    }

    // Add business list for context with current business highlighted
    if (businesses.length > 0) {
      const businessList = businesses.map(b => {
        const isCurrent = businessId && b.id === businessId
        return isCurrent ? `${b.name} (current)` : b.name
      }).join(', ')
      userPrompt += `\n\nUser's businesses: ${businessList}`
      if (businessId) {
        const currentBusiness = businesses.find(b => b.id === businessId)
        if (currentBusiness) {
          userPrompt += `\n\nCurrent business context: ${currentBusiness.name} (use this as default if no business is specified)`
        }
      }
    }

    userPrompt += `\n\nReturn JSON with action, draft, missing fields, and assistant_message.`

    // Use smart model selection with fallback
    const model = await tokenOptimizer.getOptimalModel('extraction')
    const temperature = tokenOptimizer.getOptimalTemperature('extraction')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: 500,
        response_format: { type: 'json_object' } // Force JSON output
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Expense extraction failed' },
        { status: 500 }
      )
    }

    const completion = await openaiResponse.json()
    const extractedText = completion.choices[0]?.message?.content

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No extraction result received' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let extractedData: ExtractionResponse
    try {
      extractedData = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('Failed to parse extraction result:', parseError)
      return NextResponse.json(
        { error: 'Invalid extraction result format' },
        { status: 500 }
      )
    }

    // Post-process with business/vendor detection
    if (extractedData.draft) {
      // Enhance draft with business/vendor detection
      const enhancedDraft = await enhanceDraftWithDetection(
        extractedData.draft,
        text,
        businesses,
        businessId
      )
      extractedData.draft = enhancedDraft
    }

    // Track token usage
    const tokenUsage = completion.usage?.total_tokens || 0
    tokenOptimizer.trackTokenUsage('extract_expense', tokenUsage)

    // Add metadata
    extractedData.confidence = calculateConfidence(extractedData.draft)

    return NextResponse.json(extractedData)

  } catch (error) {
    console.error('Expense extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Enhance draft with business/vendor detection and category inference
 */
async function enhanceDraftWithDetection(
  draft: ExpenseDraft,
  text: string,
  businesses: Array<{ id: string; name: string }>,
  currentBusinessId?: string
): Promise<ExpenseDraft> {
  const enhanced = { ...draft }

  // Detect business or vendor if vendor field is set
  if (enhanced.vendor) {
    // First, try vendor dictionary lookup (with fuzzy matching and ASR error correction)
    const vendorMatch = vendorDictionary.findVendor(enhanced.vendor)
    if (vendorMatch && vendorMatch.confidence >= 0.7) {
      enhanced.vendor = vendorMatch.name
      // Get category from vendor dictionary if available
      const vendorCategory = vendorDictionary.getCategory(vendorMatch.name)
      if (vendorCategory && !enhanced.category) {
        enhanced.category = vendorCategory
      }
    }

    // Then check if it's actually a business (not a vendor)
    const detection = businessVendorDetector.detect(
      enhanced.vendor,
      businesses,
      currentBusinessId ? businesses.find(b => b.id === currentBusinessId) : undefined
    )

    if (detection.type === 'business' && detection.business) {
      // It's actually a business, not a vendor
      enhanced.business = detection.business.business.id
      enhanced.vendor = null // Clear vendor field
    } else if (detection.type === 'vendor' && !vendorMatch) {
      // Clean vendor name: remove common suffixes (Hotel, Restaurant, Store, etc.)
      let cleanedVendor = enhanced.vendor
      cleanedVendor = cleanedVendor.replace(/\s+(Hotel|Restaurant|Store|Gas\s+Station|Station)$/i, '').trim()
      
      // Try vendor dictionary again with cleaned name
      const cleanedMatch = vendorDictionary.findVendor(cleanedVendor)
      if (cleanedMatch && cleanedMatch.confidence >= 0.7) {
        enhanced.vendor = cleanedMatch.name
        // Add to dictionary for future use
        vendorDictionary.addVendor(cleanedVendor, cleanedMatch.confidence)
      } else {
        // Handle ASR errors like "Wender" → "Vendor" or "Marriott"
        if (/wender|vendor/i.test(cleanedVendor)) {
          // Try to extract vendor from context
          const vendorKeywords = ['marriott', 'hilton', 'sonesta', 'shell', 'chevron', 'starbucks']
          for (const keyword of vendorKeywords) {
            if (text.toLowerCase().includes(keyword)) {
              const keywordMatch = vendorDictionary.findVendor(keyword)
              if (keywordMatch) {
                enhanced.vendor = keywordMatch.name
                break
              }
            }
          }
        }
        
        // If still no match, use cleaned vendor and add to dictionary
        if (enhanced.vendor === cleanedVendor || !enhanced.vendor) {
          enhanced.vendor = cleanedVendor
          vendorDictionary.addVendor(cleanedVendor, 0.6) // Lower confidence for new vendors
        }
      }
    }
  }

  // Infer category if not set (expand inference patterns)
  if (!enhanced.category) {
    // First try vendor dictionary category
    if (enhanced.vendor) {
      const vendorCategory = vendorDictionary.getCategory(enhanced.vendor)
      if (vendorCategory) {
        enhanced.category = vendorCategory
      }
    }
    
    // Then try category inferrer
    if (!enhanced.category) {
      const inferred = categoryInferrer.infer(enhanced.vendor || null, text)
      if (inferred) {
        enhanced.category = inferred
      }
    }
    
    // Enhanced category inference based on vendor patterns
    if (!enhanced.category && enhanced.vendor) {
      const vendorLower = enhanced.vendor.toLowerCase()
      if (vendorLower.includes('hotel') || vendorLower.includes('marriott') || vendorLower.includes('hilton') || vendorLower.includes('sonesta')) {
        enhanced.category = 'Travel'
      } else if (vendorLower.includes('shell') || vendorLower.includes('chevron') || vendorLower.includes('gas')) {
        enhanced.category = 'Fuel'
      } else if (vendorLower.includes('starbucks') || vendorLower.includes('restaurant') || vendorLower.includes('cafe')) {
        enhanced.category = 'Meals'
      } else if (vendorLower.includes('uber') || vendorLower.includes('lyft') || vendorLower.includes('taxi')) {
        enhanced.category = 'Transportation'
      } else if (vendorLower.includes('delta') || vendorLower.includes('united') || vendorLower.includes('airline')) {
        enhanced.category = 'Travel'
      }
    }
  }

  // Parse date if not set or is relative
  if (enhanced.date) {
    const parsed = dateParser.parse(enhanced.date)
    if (parsed) {
      enhanced.date = parsed
    }
  } else {
    // Default to today
    enhanced.date = dateParser.parse('today')
  }

  // Business selection with confirmation for similar names
  if (!enhanced.business && currentBusinessId) {
    // Use current business as default if no business specified
    enhanced.business = currentBusinessId
  } else if (enhanced.business) {
    // Check if business name needs confirmation (similar names)
    const businessMatch = businessVendorDetector.findBusiness(
      enhanced.business,
      businesses
    )
    
    if (businessMatch) {
      if (businessMatch.confidence >= 0.8) {
        // High confidence - use directly
        enhanced.business = businessMatch.business.id
      } else if (businessMatch.confidence >= 0.7) {
        // Medium confidence - use but could ask for confirmation
        // For now, use it (confirmation can be added in response message)
        enhanced.business = businessMatch.business.id
      }
    } else {
      // No match found - check if it's a partial match
      const partialMatch = businesses.find(b => 
        b.name.toLowerCase().includes(enhanced.business!.toLowerCase()) ||
        enhanced.business!.toLowerCase().includes(b.name.toLowerCase())
      )
      if (partialMatch) {
        enhanced.business = partialMatch.id
      } else if (currentBusinessId) {
        // Fallback to current business
        enhanced.business = currentBusinessId
      }
    }
  } else if (currentBusinessId) {
    // No business specified - use current business context
    enhanced.business = currentBusinessId
  }

  return enhanced
}

/**
 * Calculate extraction confidence
 */
function calculateConfidence(draft: ExpenseDraft): number {
  const required = ['amount', 'vendor', 'category', 'business', 'date']
  const filled = required.filter(field => {
    const value = draft[field as keyof ExpenseDraft]
    return value !== null && value !== undefined && value !== ''
  })

  return filled.length / required.length
}


/**
 * Chat Extract Expense API Route
 * 
 * Extracts expense information from chat/text input.
 * Uses MASTER SYSTEM PROMPT for expense extraction.
 * Same implementation as voice but optimized for text input.
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

    // Build optimized user prompt
    let userPrompt = `Extract expense information from: "${text}"`

    // Add context (limited)
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      const limitedHistory = tokenOptimizer.limitHistory(context.conversationHistory, 3)
      userPrompt += `\n\nRecent conversation:\n${limitedHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
    }

    if (context?.draft) {
      userPrompt += `\n\nCurrent draft: ${JSON.stringify(context.draft)}`
    }

    if (context?.collectedData && Object.keys(context.collectedData).length > 0) {
      userPrompt += `\n\nPreviously collected: ${JSON.stringify(context.collectedData)}`
    }

    if (businesses.length > 0) {
      userPrompt += `\n\nUser's businesses: ${businesses.map(b => b.name).join(', ')}`
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
        response_format: { type: 'json_object' }
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
    tokenOptimizer.trackTokenUsage('chat_extract_expense', tokenUsage)

    // Add confidence
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
 * Enhance draft with detection (same as voice)
 */
async function enhanceDraftWithDetection(
  draft: ExpenseDraft,
  text: string,
  businesses: Array<{ id: string; name: string }>,
  currentBusinessId?: string
): Promise<ExpenseDraft> {
  const enhanced = { ...draft }

  if (enhanced.vendor) {
    const detection = businessVendorDetector.detect(
      enhanced.vendor,
      businesses,
      currentBusinessId ? businesses.find(b => b.id === currentBusinessId) : undefined
    )

    if (detection.type === 'business' && detection.business) {
      enhanced.business = detection.business.business.id
      enhanced.vendor = null
    } else if (detection.type === 'vendor') {
      const knownVendors = [
        'Sonesta', 'Marriott', 'Hilton', 'Shell', 'Chevron', 'Starbucks',
        'Uber', 'Lyft', 'Delta', 'United', 'American'
      ]
      const fuzzyMatch = fuzzyMatcher.fuzzyMatchVendor(enhanced.vendor, knownVendors)
      if (fuzzyMatch) {
        enhanced.vendor = fuzzyMatch.match
      }
    }
  }

  if (!enhanced.category) {
    const inferred = categoryInferrer.infer(enhanced.vendor || null, text)
    if (inferred) {
      enhanced.category = inferred
    }
  }

  if (enhanced.date) {
    const parsed = dateParser.parse(enhanced.date)
    if (parsed) {
      enhanced.date = parsed
    }
  } else {
    enhanced.date = dateParser.parse('today')
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


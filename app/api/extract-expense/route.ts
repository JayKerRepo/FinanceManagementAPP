export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { tokenOptimizer } from '../../../src/services/TokenOptimizer'

interface ExpenseExtractionRequest {
  text: string
  businessId?: string
  context?: {
    previousExpenses?: any[]
    userPreferences?: any
    conversationHistory?: Array<{ role: string; content: string }>
    collectedData?: Record<string, any>
    currentIntent?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, businessId, context }: ExpenseExtractionRequest = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for extraction' },
        { status: 400 }
      )
    }

    // Create a structured prompt for expense extraction with context awareness
    const systemPrompt = `You are an AI assistant that extracts expense information from voice or text input. 
    Extract the following information and return it as JSON:
    - amount: number (required)
    - description: string (required)
    - category: string (one of: Office & Admin, Marketing, Travel & Meals, Software, Equipment, Utilities, Professional Services, Other)
    - business: string (if mentioned, otherwise use context or "General")
    - date: string (ISO format, default to today if not mentioned)
    - vendor: string (if mentioned)
    - confidence: number (0-1, how confident you are in the extraction)
    
    Use conversation context to fill in missing information. If user is correcting previous data, update accordingly.
    If any required information is missing or unclear, set confidence to a lower value and make your best guess.
    Return only valid JSON, no other text.`

    // Build user prompt with context
    let userPrompt = `Extract expense information from: "${text}"`
    
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      userPrompt += `\n\nRecent conversation context:\n${context.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`
    }
    
    if (context?.collectedData && Object.keys(context.collectedData).length > 0) {
      userPrompt += `\n\nPreviously collected data: ${JSON.stringify(context.collectedData)}`
    }
    
    if (context?.userPreferences) {
      userPrompt += `\n\nUser preferences: ${JSON.stringify(context.userPreferences)}`
    }

    // Call OpenAI GPT API for expense extraction with smart model selection and fallback
    let completion
    try {
      completion = await tokenOptimizer.callWithModelFallback('extraction', async (model) => {
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
            temperature: 0.1,
            max_tokens: 500
          })
        })

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json()
          // Throw error to trigger fallback to next model
          throw new Error(JSON.stringify(errorData))
        }

        return await openaiResponse.json()
      })
    } catch (error: any) {
      const errorData = error?.message ? JSON.parse(error.message) : error
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Expense extraction failed' },
        { status: 500 }
      )
    }
    const extractedText = completion.choices[0]?.message?.content

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No extraction result received' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let extractedExpense
    try {
      extractedExpense = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('Failed to parse extraction result:', parseError)
      return NextResponse.json(
        { error: 'Invalid extraction result format' },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!extractedExpense.amount || !extractedExpense.description) {
      return NextResponse.json(
        { error: 'Missing required expense information' },
        { status: 400 }
      )
    }

    // Add metadata
    extractedExpense.extractedAt = new Date().toISOString()
    extractedExpense.source = 'voice'
    extractedExpense.originalText = text

    return NextResponse.json({
      expense: extractedExpense,
      success: true
    })

  } catch (error) {
    console.error('Expense extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'

interface ExpenseExtractionRequest {
  text: string
  businessId?: string
  context?: {
    previousExpenses?: any[]
    userPreferences?: any
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

    // Create a structured prompt for expense extraction
    const systemPrompt = `You are an AI assistant that extracts expense information from voice or text input. 
    Extract the following information and return it as JSON:
    - amount: number (required)
    - description: string (required)
    - category: string (one of: food, travel, office, marketing, supplies, utilities, other)
    - business: string (if mentioned, otherwise use "General")
    - date: string (ISO format, default to today if not mentioned)
    - vendor: string (if mentioned)
    - confidence: number (0-1, how confident you are in the extraction)
    
    If any required information is missing or unclear, set confidence to a lower value and make your best guess.
    Return only valid JSON, no other text.`

    const userPrompt = `Extract expense information from: "${text}"`

    // Call OpenAI GPT API for expense extraction
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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







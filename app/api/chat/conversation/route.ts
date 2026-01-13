/**
 * Chat Conversation API Route
 * 
 * Handles chat conversation requests with same optimizations as voice.
 * Uses DEVELOPER SYSTEM PROMPT for conversation handling.
 * Returns action-based JSON format.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { recognizeIntent } from '../../../../src/lib/voiceAgentUtils'
import { getDeveloperSystemPrompt } from '../../../../src/lib/prompts/systemPrompts'
import { tokenOptimizer } from '../../../../src/services/TokenOptimizer'
import { smartQuestionGenerator } from '../../../../src/services/SmartQuestionGenerator'
import { conversationStateManager } from '../../../../src/services/ConversationStateManager'
import type { PersonalityType } from '../../../../src/services/interfaces/ISmartQuestionGenerator'

interface ConversationRequest {
  message: string
  context?: {
    conversationHistory?: Array<{ role: string; content: string }>
    currentIntent?: string
    collectedData?: Record<string, any>
    userPreferences?: Record<string, any>
    draft?: any
    isSaved?: boolean
  }
  personality?: PersonalityType
  businessId?: string
  businesses?: Array<{ id: string; name: string }>
}

interface AgentResponse {
  action: 'interpret' | 'request_more_info' | 'create_expense' | 'update_draft' | 'status_response'
  draft?: any
  data?: any
  missing?: string[]
  updated_fields?: Record<string, any>
  assistant_message: string
  needs_followup?: string[]
  completion_status?: {
    isComplete: boolean
    missingFields: string[]
    hasBeenSaved: boolean
    completionPercentage: number
  }
  rich_formatting?: {
    showButtons?: boolean
    suggestions?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationRequest = await request.json()
    const {
      message,
      context,
      personality = 'friendly',
      businessId,
      businesses = []
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      )
    }

    // Check for status questions
    const isStatusQuestion = /^(are you done|is it complete|what's left|is it ready|are we done)/i.test(
      message.trim()
    )

    if (isStatusQuestion) {
      const draft = context?.draft || {}
      const isSaved = context?.isSaved || false
      const response = smartQuestionGenerator.handleStatusQuestion(
        draft,
        isSaved,
        personality
      )

      const completionStatus = conversationStateManager.getCompletionStatus()

      return NextResponse.json({
        action: 'status_response',
        assistant_message: response,
        completion_status: completionStatus,
        rich_formatting: {
          showButtons: !isSaved,
          suggestions: isSaved ? [] : ['Save now', 'Add more details']
        }
      } as AgentResponse)
    }

    // Recognize intent
    const intentResult = recognizeIntent(message)

    // Generate response
    const response = await generateOptimizedResponse(
      intentResult,
      message,
      context,
      personality,
      businessId,
      businesses
    )

    // Track token usage
    tokenOptimizer.trackTokenUsage('chat_conversation', response.estimatedTokens || 0)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized AI response (same logic as voice, optimized for chat)
 */
async function generateOptimizedResponse(
  intentResult: { intent: string; entities: Record<string, any>; confidence: number },
  message: string,
  context: ConversationRequest['context'],
  personality: PersonalityType,
  businessId?: string,
  businesses: Array<{ id: string; name: string }> = []
): Promise<AgentResponse & { estimatedTokens?: number }> {
  const { intent, entities } = intentResult

  // Get optimized system prompt
  const systemPrompt = getDeveloperSystemPrompt()

  // Build optimized user prompt
  let userPrompt = `User said: "${message}"\n\n`

  // Limit conversation history
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    const limitedHistory = tokenOptimizer.limitHistory(context.conversationHistory, 5)
    userPrompt += 'Recent conversation:\n'
    limitedHistory.forEach(msg => {
      userPrompt += `${msg.role}: ${msg.content}\n`
    })
    userPrompt += '\n'
  }

  if (context?.collectedData && Object.keys(context.collectedData).length > 0) {
    userPrompt += `Collected data: ${JSON.stringify(context.collectedData)}\n\n`
  }

  if (context?.draft) {
    userPrompt += `Current draft: ${JSON.stringify(context.draft)}\n\n`
  }

  // Add businesses list for multi-business logic (critical for MASTER SYSTEM PROMPT)
  if (businesses.length > 0) {
    userPrompt += `User's businesses: ${businesses.map(b => `${b.name} (ID: ${b.id})`).join(', ')}\n\n`
    const currentBusiness = businessId ? businesses.find(b => b.id === businessId) : null
    userPrompt += `Current business context: ${currentBusiness ? currentBusiness.name : 'None'}\n\n`
  }

  userPrompt += `Intent: ${intent}\nEntities: ${JSON.stringify(entities)}\n\n`
  userPrompt += `Generate response in JSON format with action type.`

  // Use smart model selection with fallback
  const model = await tokenOptimizer.getOptimalModel('conversation')
  const temperature = tokenOptimizer.getOptimalTemperature('conversation')

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
    throw new Error('Failed to generate response')
  }

  const completion = await openaiResponse.json()
  const responseText = completion.choices[0]?.message?.content

  if (!responseText) {
    throw new Error('No response received from OpenAI')
  }

  // Parse JSON response
  let agentResponse: AgentResponse
  try {
    agentResponse = JSON.parse(responseText)
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError)
    agentResponse = {
      action: 'interpret',
      assistant_message: "I'm not sure how to respond to that. Could you rephrase?",
      needs_followup: []
    }
  }

  // Add rich formatting for chat
  agentResponse.rich_formatting = {
    showButtons: agentResponse.action === 'request_more_info' || agentResponse.action === 'create_expense',
    suggestions: agentResponse.missing || []
  }

  const estimatedTokens = completion.usage?.total_tokens || 0

  return {
    ...agentResponse,
    estimatedTokens
  }
}


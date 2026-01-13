/**
 * Voice Conversation API Route
 * 
 * Handles voice conversation requests with optimized token usage and
 * action-based JSON responses.
 * 
 * Uses DEVELOPER SYSTEM PROMPT for conversation handling.
 * Returns action-based JSON format for downstream processing.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { recognizeIntent } from '../../../../src/lib/voiceAgentUtils'
import { getDeveloperSystemPrompt, getStatusQuestionPrompt } from '../../../../src/lib/prompts/systemPrompts'
import { tokenOptimizer } from '../../../../src/services/TokenOptimizer'
import { ExpenseDraftManager } from '../../../../src/services/ExpenseDraftManager'
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
      // Handle status question
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
        completion_status: completionStatus
      } as AgentResponse)
    }

    // Recognize intent
    const intentResult = recognizeIntent(message)

    // Generate response using optimized system prompt
    const response = await generateOptimizedResponse(
      intentResult,
      message,
      context,
      personality,
      businessId,
      businesses
    )

    // Track token usage
    tokenOptimizer.trackTokenUsage('voice_conversation', response.estimatedTokens || 0)

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
 * Generate optimized AI response
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

  // Detect if this is a follow-up answer (short response after a question)
  const isShortAnswer = message.split(' ').length <= 5
  const lastAssistantMessage = context?.conversationHistory
    ?.filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || ''
  
  const isFollowUpAnswer = isShortAnswer && (
    lastAssistantMessage.includes('Which') ||
    lastAssistantMessage.includes('What') ||
    lastAssistantMessage.includes('vendor') ||
    lastAssistantMessage.includes('business') ||
    lastAssistantMessage.includes('amount') ||
    lastAssistantMessage.includes('Could you') ||
    lastAssistantMessage.includes('Please')
  )

  if (isFollowUpAnswer) {
    userPrompt += `IMPORTANT: User is providing a short answer to a previous question. `
    userPrompt += `Last assistant question: "${lastAssistantMessage}"\n`
    userPrompt += `Determine which field the user is answering based on the last question asked.\n`
    userPrompt += `If the question was about vendor → update vendor field\n`
    userPrompt += `If the question was about business → update business field\n`
    userPrompt += `If the question was about amount → update amount field\n\n`
  }

  // Limit conversation history to reduce tokens (use more context for follow-ups)
  const historyLimit = isFollowUpAnswer ? 10 : 5
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    const limitedHistory = tokenOptimizer.limitHistory(context.conversationHistory, historyLimit)
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
      response_format: { type: 'json_object' } // Force JSON output
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
    // Fallback response
    agentResponse = {
      action: 'interpret',
      assistant_message: "I'm not sure how to respond to that. Could you rephrase?",
      needs_followup: []
    }
  }

  // Estimate token usage
  const estimatedTokens = completion.usage?.total_tokens || 0

  return {
    ...agentResponse,
    estimatedTokens
  }
}

/**
 * PersonalityEngine
 * Generates personality-based responses for the voice agent
 */

export type PersonalityType = 'professional' | 'friendly' | 'analytical'

export interface PersonalityConfig {
  type: PersonalityType
  tone: string
  greeting: string
  responseStyle: string
  emotionalIntelligence: boolean
}

export interface ResponseOptions {
  includeEmoji?: boolean
  includeEncouragement?: boolean
  includeDetails?: boolean
  conversational?: boolean
}

export class PersonalityEngine {
  private config: PersonalityConfig

  constructor(personality: PersonalityType = 'friendly') {
    this.config = this.getPersonalityConfig(personality)
  }

  /**
   * Get personality configuration
   */
  private getPersonalityConfig(personality: PersonalityType): PersonalityConfig {
    const configs: Record<PersonalityType, PersonalityConfig> = {
      professional: {
        type: 'professional',
        tone: 'formal and business-focused',
        greeting: 'Good morning. I\'m your financial assistant.',
        responseStyle: 'concise and data-driven',
        emotionalIntelligence: false
      },
      friendly: {
        type: 'friendly',
        tone: 'warm and encouraging',
        greeting: 'Hey there! I\'m your AI expense assistant. How can I help you today?',
        responseStyle: 'conversational and supportive',
        emotionalIntelligence: true
      },
      analytical: {
        type: 'analytical',
        tone: 'precise and insightful',
        greeting: 'Hello. I\'m here to analyze your financial data.',
        responseStyle: 'detailed with insights',
        emotionalIntelligence: false
      }
    }

    return configs[personality]
  }

  /**
   * Generate greeting message
   */
  generateGreeting(): string {
    return this.config.greeting
  }

  /**
   * Generate response based on personality
   */
  generateResponse(
    baseMessage: string,
    options: ResponseOptions = {}
  ): string {
    let response = baseMessage

    // Apply personality-specific modifications
    if (this.config.type === 'friendly') {
      if (options.includeEncouragement) {
        response = this.addEncouragement(response)
      }
      if (options.includeEmoji) {
        response = this.addEmojis(response)
      }
    } else if (this.config.type === 'professional') {
      response = this.makeProfessional(response)
    } else if (this.config.type === 'analytical') {
      response = this.addAnalysis(response)
    }

    return response
  }

  /**
   * Generate expense confirmation message
   */
  generateExpenseConfirmation(expense: {
    amount: number
    vendor?: string
    category?: string
    business?: string
  }): string {
    const { amount, vendor, category, business } = expense

    if (this.config.type === 'friendly') {
      return `Got it! I've added $${amount.toFixed(2)}${vendor ? ` for ${vendor}` : ''}${category ? ` under ${category}` : ''}${business ? ` to ${business}` : ''}. Anything else?`
    } else if (this.config.type === 'professional') {
      return `Expense recorded: $${amount.toFixed(2)}${vendor ? ` - ${vendor}` : ''}${category ? ` (${category})` : ''}${business ? ` for ${business}` : ''}.`
    } else {
      return `Expense logged: $${amount.toFixed(2)}${vendor ? ` at ${vendor}` : ''}${category ? `, categorized as ${category}` : ''}${business ? `, assigned to ${business}` : ''}.`
    }
  }

  /**
   * Generate clarification request
   */
  generateClarification(whatNeeded: string): string {
    if (this.config.type === 'friendly') {
      return `I didn't quite catch the ${whatNeeded}. Could you tell me again?`
    } else if (this.config.type === 'professional') {
      return `Please provide the ${whatNeeded}.`
    } else {
      return `The ${whatNeeded} is required. Please specify.`
    }
  }

  /**
   * Generate error message
   */
  generateErrorMessage(error: string): string {
    if (this.config.type === 'friendly') {
      return `${error} Let's try that again.`
    } else if (this.config.type === 'professional') {
      return `Error: ${error} Please retry.`
    } else {
      return `Processing error: ${error}`
    }
  }

  /**
   * Generate success message
   */
  generateSuccessMessage(action: string): string {
    if (this.config.type === 'friendly') {
      return `Perfect! ${action} is done. What's next?`
    } else if (this.config.type === 'professional') {
      return `${action} completed successfully.`
    } else {
      return `${action} executed. Status: Success.`
    }
  }

  /**
   * Add encouragement to message
   */
  private addEncouragement(message: string): string {
    const encouragements = [
      'Great!',
      'Perfect!',
      'Awesome!',
      'Excellent!',
      'Nice!',
    ]
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
    return `${encouragement} ${message}`
  }

  /**
   * Add emojis to message (friendly personality)
   */
  private addEmojis(message: string): string {
    // Simple emoji addition - can be enhanced
    if (message.includes('expense') || message.includes('added')) {
      return `💰 ${message}`
    } else if (message.includes('budget') || message.includes('spending')) {
      return `📊 ${message}`
    } else if (message.includes('invoice')) {
      return `📄 ${message}`
    } else if (message.includes('report')) {
      return `📈 ${message}`
    }
    return message
  }

  /**
   * Make message professional
   */
  private makeProfessional(message: string): string {
    // Remove casual language, ensure formal tone
    return message
      .replace(/got it/gi, 'understood')
      .replace(/nice/gi, 'acknowledged')
      .replace(/awesome/gi, 'excellent')
  }

  /**
   * Add analytical insights
   */
  private addAnalysis(message: string): string {
    // Add data-driven context
    return message
  }

  /**
   * Generate proactive insight message
   */
  generateProactiveInsight(insight: {
    type: 'warning' | 'opportunity' | 'achievement'
    message: string
    data?: any
  }): string {
    const { type, message, data } = insight

    if (this.config.type === 'friendly') {
      if (type === 'achievement') {
        return `🎉 Great news! ${message}`
      } else if (type === 'opportunity') {
        return `💡 I noticed something: ${message}`
      } else {
        return `⚠️ Heads up: ${message}`
      }
    } else if (this.config.type === 'professional') {
      return `Alert: ${message}`
    } else {
      return `Analysis: ${message}${data ? ` (Data: ${JSON.stringify(data)})` : ''}`
    }
  }

  /**
   * Change personality
   */
  setPersonality(personality: PersonalityType): void {
    this.config = this.getPersonalityConfig(personality)
  }

  /**
   * Get current personality
   */
  getPersonality(): PersonalityType {
    return this.config.type
  }
}



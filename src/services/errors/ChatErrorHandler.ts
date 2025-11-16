/**
 * ChatErrorHandler
 * 
 * Handles chat-specific errors with rich error messages and visual feedback.
 * Provides user-friendly error messages optimized for text interaction.
 * 
 * @class ChatErrorHandler
 */

export type ChatErrorType =
  | 'parsing_failed'
  | 'validation_failed'
  | 'network_error'
  | 'timeout'
  | 'extraction_failed'
  | 'save_failed'
  | 'unknown'

export interface ChatError {
  type: ChatErrorType
  message: string
  retryable: boolean
  userMessage: string
  richMessage?: {
    title: string
    description: string
    suggestions: string[]
    retryButton?: boolean
  }
  technicalDetails?: string
}

export class ChatErrorHandler {
  /**
   * Handle chat-specific error
   * @param error - Error object or message
   * @param context - Additional context
   * @returns ChatError with rich user-friendly message
   */
  handleError(error: Error | string, context?: any): ChatError {
    const errorMessage = error instanceof Error ? error.message : error
    const lowerMessage = errorMessage.toLowerCase()

    // Detect error type
    let errorType: ChatErrorType = 'unknown'
    let retryable = true
    let userMessage = "I'm sorry, I encountered an error. Please try again."
    let richMessage = {
      title: 'Something went wrong',
      description: "I couldn't process that request.",
      suggestions: ['Try rephrasing your message', 'Check your internet connection', 'Try again in a moment'],
      retryButton: true
    }

    if (lowerMessage.includes('parse') || lowerMessage.includes('invalid')) {
      errorType = 'parsing_failed'
      userMessage = "I had trouble understanding that. Could you rephrase it?"
      richMessage = {
        title: 'Understanding Error',
        description: "I couldn't parse your message. Please try rephrasing.",
        suggestions: [
          'Be more specific about the expense',
          'Include the amount and vendor',
          'Try: "Add $50 for gas at Shell"'
        ],
        retryButton: true
      }
    } else if (lowerMessage.includes('validat') || lowerMessage.includes('missing')) {
      errorType = 'validation_failed'
      userMessage = "I need more information to save this expense."
      richMessage = {
        title: 'Missing Information',
        description: "Some required fields are missing.",
        suggestions: [
          'Make sure to include: amount, vendor, category, and business',
          'Try: "Add $250 expense for Meta ads to Business Alpha"'
        ],
        retryButton: false
      }
    } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      errorType = 'network_error'
      userMessage = "I'm having trouble connecting. Please check your internet connection."
      richMessage = {
        title: 'Connection Error',
        description: "I couldn't reach the server. Please check your internet connection.",
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ],
        retryButton: true
      }
    } else if (lowerMessage.includes('timeout') || lowerMessage.includes('time out')) {
      errorType = 'timeout'
      userMessage = "That request took too long. Let's try again."
      richMessage = {
        title: 'Request Timeout',
        description: "The request took too long to process.",
        suggestions: [
          'Try again with a simpler request',
          'Check your internet connection',
          'Wait a moment and retry'
        ],
        retryButton: true
      }
    } else if (lowerMessage.includes('extract') || lowerMessage.includes('parse')) {
      errorType = 'extraction_failed'
      userMessage = "I had trouble extracting the expense information. Could you provide more details?"
      richMessage = {
        title: 'Extraction Error',
        description: "I couldn't extract all the expense details from your message.",
        suggestions: [
          'Be more specific: "Add $50 for gas at Shell for Business Alpha"',
          'Include the amount, vendor, and business name',
          'Try breaking it into smaller parts'
        ],
        retryButton: true
      }
    } else if (lowerMessage.includes('save') || lowerMessage.includes('database')) {
      errorType = 'save_failed'
      userMessage = "I had trouble saving that expense. Let me try again."
      richMessage = {
        title: 'Save Error',
        description: "The expense couldn't be saved to the database.",
        suggestions: [
          'Check that all required fields are filled',
          'Verify your business selection',
          'Try again in a moment'
        ],
        retryButton: true
      }
    }

    return {
      type: errorType,
      message: errorMessage,
      retryable,
      userMessage,
      richMessage,
      technicalDetails: context?.technicalDetails
    }
  }

  /**
   * Generate retry button component props
   * @param error - Chat error
   * @param onRetry - Retry callback function
   * @returns Retry button configuration
   */
  getRetryButton(error: ChatError, onRetry: () => void): {
    show: boolean
    label: string
    onClick: () => void
  } {
    return {
      show: error.retryable && error.richMessage?.retryButton === true,
      label: 'Try Again',
      onClick: onRetry
    }
  }
}

// Export singleton instance
export const chatErrorHandler = new ChatErrorHandler()




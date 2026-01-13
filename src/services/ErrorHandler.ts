/**
 * ErrorHandler
 * 
 * Centralized error handling system that routes errors to appropriate handlers
 * (VoiceErrorHandler or ChatErrorHandler) based on context.
 * 
 * @class ErrorHandler
 */

import { VoiceErrorHandler, VoiceError } from './errors/VoiceErrorHandler'
import { ChatErrorHandler, ChatError } from './errors/ChatErrorHandler'

export type ErrorContext = 'voice' | 'chat' | 'shared'

export class ErrorHandler {
  private voiceHandler: VoiceErrorHandler
  private chatHandler: ChatErrorHandler

  constructor() {
    this.voiceHandler = new VoiceErrorHandler()
    this.chatHandler = new ChatErrorHandler()
  }

  /**
   * Handle error based on context
   * @param error - Error object or message
   * @param context - Error context (voice, chat, or shared)
   * @param additionalContext - Additional context information
   * @returns Appropriate error response
   */
  handle(
    error: Error | string,
    context: ErrorContext = 'shared',
    additionalContext?: any
  ): VoiceError | ChatError {
    switch (context) {
      case 'voice':
        return this.voiceHandler.handleError(error, additionalContext)
      case 'chat':
        return this.chatHandler.handleError(error, additionalContext)
      default:
        // Default to chat handler for shared errors
        return this.chatHandler.handleError(error, additionalContext)
    }
  }

  /**
   * Get voice error handler
   * @returns VoiceErrorHandler instance
   */
  getVoiceHandler(): VoiceErrorHandler {
    return this.voiceHandler
  }

  /**
   * Get chat error handler
   * @returns ChatErrorHandler instance
   */
  getChatHandler(): ChatErrorHandler {
    return this.chatHandler
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler()







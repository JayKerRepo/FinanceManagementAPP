/**
 * VoiceErrorHandler
 * 
 * Handles voice-specific errors with appropriate prompts and retry mechanisms.
 * Provides user-friendly error messages optimized for voice interaction.
 * 
 * @class VoiceErrorHandler
 */

export type VoiceErrorType =
  | 'transcription_failed'
  | 'audio_quality_poor'
  | 'no_speech_detected'
  | 'interrupted'
  | 'timeout'
  | 'network_error'
  | 'extraction_failed'
  | 'save_failed'
  | 'unknown'

export interface VoiceError {
  type: VoiceErrorType
  message: string
  retryable: boolean
  userMessage: string
  technicalDetails?: string
}

export class VoiceErrorHandler {
  /**
   * Handle voice-specific error
   * @param error - Error object or message
   * @param context - Additional context
   * @returns VoiceError with user-friendly message
   */
  handleError(error: Error | string, context?: any): VoiceError {
    const errorMessage = error instanceof Error ? error.message : error
    const lowerMessage = errorMessage.toLowerCase()

    // Detect error type
    let errorType: VoiceErrorType = 'unknown'
    let retryable = true
    let userMessage = "I'm sorry, I didn't catch that. Could you try again?"

    if (lowerMessage.includes('transcription') || lowerMessage.includes('whisper')) {
      errorType = 'transcription_failed'
      userMessage = "I had trouble understanding that. Could you speak a bit more clearly?"
    } else if (lowerMessage.includes('audio') || lowerMessage.includes('quality')) {
      errorType = 'audio_quality_poor'
      userMessage = "The audio quality isn't great. Could you try speaking closer to the microphone?"
    } else if (lowerMessage.includes('no speech') || lowerMessage.includes('silence')) {
      errorType = 'no_speech_detected'
      userMessage = "I didn't hear anything. Could you try again?"
    } else if (lowerMessage.includes('interrupt') || lowerMessage.includes('cancel')) {
      errorType = 'interrupted'
      userMessage = "No problem. What would you like to do?"
      retryable = false
    } else if (lowerMessage.includes('timeout') || lowerMessage.includes('time out')) {
      errorType = 'timeout'
      userMessage = "That took a bit too long. Let's try again."
    } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      errorType = 'network_error'
      userMessage = "I'm having trouble connecting. Please check your internet and try again."
    } else if (lowerMessage.includes('extract') || lowerMessage.includes('parse')) {
      errorType = 'extraction_failed'
      userMessage = "I had trouble understanding that expense. Could you tell me again?"
    } else if (lowerMessage.includes('save') || lowerMessage.includes('database')) {
      errorType = 'save_failed'
      userMessage = "I had trouble saving that. Let me try again."
    }

    return {
      type: errorType,
      message: errorMessage,
      retryable,
      userMessage,
      technicalDetails: context?.technicalDetails
    }
  }

  /**
   * Generate retry prompt
   * @param error - Voice error
   * @param attempt - Current attempt number
   * @returns Retry prompt message
   */
  getRetryPrompt(error: VoiceError, attempt: number): string {
    if (!error.retryable) {
      return error.userMessage
    }

    if (attempt === 1) {
      return error.userMessage
    } else if (attempt === 2) {
      return "Let me try that again. " + error.userMessage
    } else {
      return "I'm still having trouble. Could you rephrase that differently?"
    }
  }

  /**
   * Check if error should trigger retry
   * @param error - Voice error
   * @param attempt - Current attempt number
   * @param maxRetries - Maximum retry attempts
   * @returns True if should retry
   */
  shouldRetry(error: VoiceError, attempt: number, maxRetries: number = 3): boolean {
    if (!error.retryable) {
      return false
    }

    if (attempt >= maxRetries) {
      return false
    }

    // Don't retry non-retryable errors
    if (error.type === 'interrupted') {
      return false
    }

    return true
  }

  /**
   * Get delay before retry (exponential backoff)
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt - 1), 4000)
  }
}

// Export singleton instance
export const voiceErrorHandler = new VoiceErrorHandler()






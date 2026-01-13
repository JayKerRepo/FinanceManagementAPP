/**
 * Error Types
 * 
 * Type definitions for error handling system.
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

export type ChatErrorType =
  | 'parsing_failed'
  | 'validation_failed'
  | 'network_error'
  | 'timeout'
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

export type ErrorContext = 'voice' | 'chat' | 'shared'







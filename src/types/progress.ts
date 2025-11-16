/**
 * Progress Types
 * 
 * Type definitions for progress tracking system.
 */

export type ProgressStep =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'understanding'
  | 'extracting'
  | 'validating'
  | 'saving'
  | 'complete'
  | 'error'

export interface ProgressState {
  currentStep: ProgressStep
  stepNumber: number
  totalSteps: number
  percentage: number
  message: string
  estimatedTimeRemaining: number
  startTime: number
}

export interface ProgressStepConfig {
  step: ProgressStep
  label: string
  estimatedDuration: number
  isVoiceOnly: boolean
}




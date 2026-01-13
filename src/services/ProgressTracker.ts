/**
 * ProgressTracker
 * 
 * Tracks and manages progress indicators for expense entry process.
 * Provides step-by-step feedback to users during processing.
 * 
 * Progress Steps:
 * 1. Listening... (voice only)
 * 2. Transcribing audio... (voice only)
 * 3. Understanding your request...
 * 4. Extracting expense details...
 * 5. Validating information...
 * 6. Saving expense...
 * 7. Complete!
 * 
 * @class ProgressTracker
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
  estimatedTimeRemaining: number // milliseconds
  startTime: number
}

export interface ProgressStepConfig {
  step: ProgressStep
  label: string
  estimatedDuration: number // milliseconds
  isVoiceOnly: boolean
}

export class ProgressTracker {
  private state: ProgressState
  private stepConfigs: ProgressStepConfig[] = [
    { step: 'listening', label: 'Listening...', estimatedDuration: 2000, isVoiceOnly: true },
    { step: 'transcribing', label: 'Transcribing audio...', estimatedDuration: 3000, isVoiceOnly: true },
    { step: 'understanding', label: 'Understanding your request...', estimatedDuration: 1500, isVoiceOnly: false },
    { step: 'extracting', label: 'Extracting expense details...', estimatedDuration: 2000, isVoiceOnly: false },
    { step: 'validating', label: 'Validating information...', estimatedDuration: 1000, isVoiceOnly: false },
    { step: 'saving', label: 'Saving expense...', estimatedDuration: 1500, isVoiceOnly: false },
    { step: 'complete', label: 'Complete!', estimatedDuration: 0, isVoiceOnly: false }
  ]

  constructor() {
    this.state = {
      currentStep: 'idle',
      stepNumber: 0,
      totalSteps: this.stepConfigs.length,
      percentage: 0,
      message: 'Ready',
      estimatedTimeRemaining: 0,
      startTime: Date.now()
    }
  }

  /**
   * Start progress tracking
   * @param isVoice - Whether this is a voice operation
   */
  start(isVoice: boolean = false): void {
    this.state = {
      currentStep: isVoice ? 'listening' : 'understanding',
      stepNumber: isVoice ? 1 : 3,
      totalSteps: this.stepConfigs.length,
      percentage: 0,
      message: isVoice ? 'Listening...' : 'Understanding your request...',
      estimatedTimeRemaining: this.calculateEstimatedTime(isVoice),
      startTime: Date.now()
    }
  }

  /**
   * Move to next step
   * @param isVoice - Whether this is a voice operation
   */
  nextStep(isVoice: boolean = false): void {
    const currentIndex = this.stepConfigs.findIndex(
      config => config.step === this.state.currentStep
    )

    if (currentIndex === -1 || currentIndex >= this.stepConfigs.length - 1) {
      return
    }

    // Skip voice-only steps if not voice
    let nextIndex = currentIndex + 1
    while (
      nextIndex < this.stepConfigs.length &&
      this.stepConfigs[nextIndex].isVoiceOnly &&
      !isVoice
    ) {
      nextIndex++
    }

    if (nextIndex >= this.stepConfigs.length) {
      this.complete()
      return
    }

    const nextConfig = this.stepConfigs[nextIndex]
    this.state = {
      ...this.state,
      currentStep: nextConfig.step,
      stepNumber: nextIndex + 1,
      percentage: Math.round(((nextIndex + 1) / this.stepConfigs.length) * 100),
      message: nextConfig.label,
      estimatedTimeRemaining: this.calculateEstimatedTime(isVoice, nextIndex)
    }
  }

  /**
   * Mark progress as complete
   */
  complete(): void {
    this.state = {
      ...this.state,
      currentStep: 'complete',
      stepNumber: this.stepConfigs.length,
      percentage: 100,
      message: 'Complete!',
      estimatedTimeRemaining: 0
    }
  }

  /**
   * Mark progress as error
   * @param errorMessage - Error message to display
   */
  error(errorMessage: string): void {
    this.state = {
      ...this.state,
      currentStep: 'error',
      message: `Error: ${errorMessage}`,
      estimatedTimeRemaining: 0
    }
  }

  /**
   * Get current progress state
   * @returns Current progress state
   */
  getState(): ProgressState {
    return { ...this.state }
  }

  /**
   * Reset progress tracker
   */
  reset(): void {
    this.state = {
      currentStep: 'idle',
      stepNumber: 0,
      totalSteps: this.stepConfigs.length,
      percentage: 0,
      message: 'Ready',
      estimatedTimeRemaining: 0,
      startTime: Date.now()
    }
  }

  /**
   * Calculate estimated time remaining
   * @param isVoice - Whether this is a voice operation
   * @param currentIndex - Current step index
   * @returns Estimated time in milliseconds
   */
  private calculateEstimatedTime(isVoice: boolean, currentIndex?: number): number {
    const startIndex = currentIndex !== undefined ? currentIndex : (isVoice ? 0 : 2)
    const remainingSteps = this.stepConfigs.slice(startIndex)
    const totalTime = remainingSteps.reduce(
      (sum, config) => sum + config.estimatedDuration,
      0
    )
    return totalTime
  }

  /**
   * Get step configuration
   * @param step - Progress step
   * @returns Step configuration or null
   */
  getStepConfig(step: ProgressStep): ProgressStepConfig | null {
    return this.stepConfigs.find(config => config.step === step) || null
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker()







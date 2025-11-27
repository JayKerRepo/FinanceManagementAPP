/**
 * VoiceActivityDetector (VAD)
 * 
 * Detects when user stops speaking to avoid interrupting too early,
 * and when to stop waiting to avoid waiting too long.
 * 
 * Configuration:
 * - Minimum silence duration: 1.5 seconds (before processing)
 * - Maximum wait time: 5 seconds (don't wait too long)
 * - Background noise threshold: -40dB
 * - Speech confidence threshold: 0.7
 * 
 * @class VoiceActivityDetector
 */

export interface VADConfig {
  minSilenceDuration: number // milliseconds
  maxWaitTime: number // milliseconds
  noiseThreshold: number // dB
  speechConfidence: number // 0-1
}

export interface VADState {
  isListening: boolean
  isSpeaking: boolean
  silenceStartTime: number | null
  lastSpeechTime: number
  audioLevel: number // dB
  confidence: number // 0-1
}

export class VoiceActivityDetector {
  private config: VADConfig
  private state: VADState
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null

  constructor(config?: Partial<VADConfig>) {
    this.config = {
      minSilenceDuration: 1500, // 1.5 seconds
      maxWaitTime: 5000, // 5 seconds
      noiseThreshold: -40, // dB
      speechConfidence: 0.7,
      ...config
    }

    this.state = {
      isListening: false,
      isSpeaking: false,
      silenceStartTime: null,
      lastSpeechTime: 0,
      audioLevel: -Infinity,
      confidence: 0
    }
  }

  /**
   * Initialize audio context and analyser
   * @returns Promise that resolves when initialized
   */
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
    } catch (error) {
      console.error('Failed to initialize VAD:', error)
      throw error
    }
  }

  /**
   * Start listening for voice activity
   * @param stream - Media stream from microphone
   */
  startListening(stream: MediaStream): void {
    if (!this.audioContext || !this.analyser) {
      throw new Error('VAD not initialized. Call initialize() first.')
    }

    this.stream = stream
    this.microphone = this.audioContext.createMediaStreamSource(stream)
    this.microphone.connect(this.analyser)

    this.state.isListening = true
    this.state.lastSpeechTime = Date.now()
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    this.state.isListening = false
    this.state.isSpeaking = false
    this.state.silenceStartTime = null
  }

  /**
   * Check if user has stopped speaking (silence detected)
   * @returns True if silence detected for minimum duration
   */
  hasStoppedSpeaking(): boolean {
    if (!this.state.isListening || !this.analyser) {
      return false
    }

    const now = Date.now()
    const audioLevel = this.getAudioLevel()

    // Update state
    this.state.audioLevel = audioLevel
    this.state.confidence = this.calculateConfidence(audioLevel)

    // Check if audio level is below threshold (silence)
    if (audioLevel < this.config.noiseThreshold) {
      // Start tracking silence
      if (this.state.silenceStartTime === null) {
        this.state.silenceStartTime = now
      }

      // Check if silence duration exceeds minimum
      const silenceDuration = now - this.state.silenceStartTime
      if (silenceDuration >= this.config.minSilenceDuration) {
        this.state.isSpeaking = false
        return true
      }
    } else {
      // Speech detected, reset silence tracking
      this.state.silenceStartTime = null
      this.state.isSpeaking = true
      this.state.lastSpeechTime = now
    }

    return false
  }

  /**
   * Check if we've waited too long
   * @returns True if max wait time exceeded
   */
  hasWaitedTooLong(): boolean {
    if (!this.state.isListening) {
      return false
    }

    const now = Date.now()
    const timeSinceLastSpeech = now - this.state.lastSpeechTime

    return timeSinceLastSpeech >= this.config.maxWaitTime
  }

  /**
   * Get current audio level in dB
   * @returns Audio level in decibels
   */
  private getAudioLevel(): number {
    if (!this.analyser) {
      return -Infinity
    }

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    // Calculate average amplitude
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const average = sum / bufferLength

    // Convert to dB (approximate)
    const db = 20 * Math.log10(average / 255)
    return isFinite(db) ? db : -Infinity
  }

  /**
   * Calculate speech confidence from audio level
   * @param audioLevel - Current audio level in dB
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(audioLevel: number): number {
    // Normalize audio level to 0-1 range
    // -60dB = 0, -20dB = 1
    const normalized = Math.max(0, Math.min(1, (audioLevel + 60) / 40))
    return normalized
  }

  /**
   * Get current VAD state
   * @returns Current state
   */
  getState(): VADState {
    return { ...this.state }
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopListening()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.analyser = null
  }
}

// Export default configuration
export const defaultVADConfig: VADConfig = {
  minSilenceDuration: 1500, // 1.5 seconds
  maxWaitTime: 5000, // 5 seconds
  noiseThreshold: -40, // dB
  speechConfidence: 0.7
}






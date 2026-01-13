'use client'

/**
 * VoiceStreamingService
 * Handles real-time audio streaming with Voice Activity Detection (VAD)
 * Provides seamless ChatGPT Voice-style experience
 */

export interface VoiceStreamingConfig {
  sampleRate?: number
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  vadThreshold?: number // Voice activity detection threshold
  silenceDuration?: number // Milliseconds of silence before auto-stop
}

export interface StreamingCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void
  onAudioData?: (chunk: Blob) => void
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void
  onError?: (error: Error) => void
}

export class VoiceStreamingService {
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null
  // Note: WebSocket not used in current implementation (using POST endpoints instead)
  // private websocket: WebSocket | null = null
  private audioChunks: Blob[] = []
  private isRecording = false
  private isProcessing = false
  private silenceTimer: NodeJS.Timeout | null = null
  private lastAudioTime = 0
  
  private config: Required<VoiceStreamingConfig>
  private callbacks: StreamingCallbacks

  constructor(
    config: VoiceStreamingConfig = {},
    callbacks: StreamingCallbacks = {}
  ) {
    this.config = {
      sampleRate: config.sampleRate ?? 44100,
      echoCancellation: config.echoCancellation ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      autoGainControl: config.autoGainControl ?? true,
      vadThreshold: config.vadThreshold ?? 0.01,
      silenceDuration: config.silenceDuration ?? 2000, // 2 seconds
    }
    this.callbacks = callbacks
  }

  /**
   * Initialize audio stream
   * Note: Using POST endpoint instead of WebSocket since Next.js doesn't support WebSocket natively
   */
  async initialize(websocketUrl?: string): Promise<void> {
    try {
      // Get user media
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        }
      })

      // Note: WebSocket would be set up here if using a separate WebSocket server
      // For now, we'll use POST requests to the /api/voice/stream endpoint

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize voice streaming')
      this.callbacks.onError?.(err)
      throw err
    }
  }

  /**
   * Start recording and streaming audio
   */
  async startRecording(): Promise<void> {
    if (!this.audioStream) {
      throw new Error('Voice streaming not initialized')
    }

    if (this.isRecording) {
      return
    }

    try {
      this.audioChunks = []
      this.isRecording = true
      this.lastAudioTime = Date.now()
      this.callbacks.onStateChange?.('listening')

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, options)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
          this.lastAudioTime = Date.now()

          // Check for silence (VAD)
          this.checkSilence()
        }
      }

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop()
      }

      // Start recording with small timeslice for real-time streaming
      this.mediaRecorder.start(100) // Collect data every 100ms

    } catch (error) {
      this.isRecording = false
      const err = error instanceof Error ? error : new Error('Failed to start recording')
      this.callbacks.onError?.(err)
      throw err
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }
    }
  }

  /**
   * Check for silence and auto-stop if needed
   */
  private checkSilence(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
    }

    this.silenceTimer = setTimeout(() => {
      const timeSinceLastAudio = Date.now() - this.lastAudioTime
      if (timeSinceLastAudio >= this.config.silenceDuration && this.isRecording) {
        // Auto-stop after silence
        this.stopRecording()
      }
    }, this.config.silenceDuration)
  }

  /**
   * Handle recording stop
   */
  private async handleRecordingStop(): Promise<void> {
    if (this.audioChunks.length > 0) {
      // Send final audio blob to server for transcription
      const finalBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' })
      
      // Send to transcription API
      try {
        const formData = new FormData()
        formData.append('audio', finalBlob, 'recording.webm')
        formData.append('isFinal', 'true')

        const response = await fetch('/api/voice/stream', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          if (result.text) {
            this.callbacks.onTranscript?.(result.text, true)
          }
        } else {
          throw new Error('Transcription failed')
        }
      } catch (error) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error('Transcription failed'))
      }

      this.callbacks.onAudioData?.(finalBlob)
    }

    this.callbacks.onStateChange?.('processing')
  }

  /**
   * Send text message to server (for conversation)
   */
  async sendMessage(message: string, context?: any): Promise<void> {
    try {
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.response) {
          this.callbacks.onTranscript?.(result.response, true)
        }
      }
    } catch (error) {
      this.callbacks.onError?.(error instanceof Error ? error : new Error('Failed to send message'))
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopRecording()

    if (this.mediaRecorder) {
      this.mediaRecorder = null
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }

    // WebSocket cleanup (if using WebSocket server)
    // if (this.websocket) {
    //   this.websocket.close()
    //   this.websocket = null
    // }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }

    this.audioChunks = []
    this.isRecording = false
    this.isProcessing = false
    this.callbacks.onStateChange?.('idle')
  }

  /**
   * Get current recording state
   */
  getState(): 'idle' | 'listening' | 'processing' | 'speaking' {
    if (this.isRecording) return 'listening'
    if (this.isProcessing) return 'processing'
    return 'idle'
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording || this.isProcessing
  }
}


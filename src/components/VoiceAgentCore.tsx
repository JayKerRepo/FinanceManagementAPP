'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, Loader, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useVoiceAgent } from '../agents/VoiceAgent/VoiceAgentHook'
import { PersonalityType } from '../services/PersonalityEngine'
import type { ExpenseDraft } from '../services/interfaces/IExpenseDraftManager'

interface VoiceAgentCoreProps {
  onExpenseExtracted?: (expense: any) => void
  businessId?: string
  className?: string
  personality?: PersonalityType
  onOpenManualEntry?: (draft: ExpenseDraft) => void
  businesses?: Array<{ id: string; name: string }>
}

export default function VoiceAgentCore({
  onExpenseExtracted,
  businessId,
  className = '',
  personality = 'friendly',
  onOpenManualEntry,
  businesses = []
}: VoiceAgentCoreProps) {
  const {
    isActive,
    state,
    currentTranscript,
    conversationHistory,
    error,
    draft,
    awaitingConfirmation,
    startListening,
    stopListening,
    resetConversation,
    setPersonality,
    pauseConversation,
    resumeConversation,
    endConversation,
    draftManager
  } = useVoiceAgent({
    personality,
    onExpenseExtracted,
    businessId,
    businesses,
    onOpenManualEntry
  })

  const [showHistory, setShowHistory] = useState(true)
  const historyEndRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLCanvasElement>(null)

  // Scroll to bottom of history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  // Draw waveform animation
  useEffect(() => {
    if (!waveformRef.current || state !== 'listening') return

    const canvas = waveformRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const drawWaveform = () => {
      if (state !== 'listening') return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#4F7CFF'
      ctx.lineWidth = 2

      const centerY = canvas.height / 2
      const bars = 50
      const barWidth = canvas.width / bars

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * (canvas.height * 0.4) + 10
        const x = i * barWidth
        ctx.beginPath()
        ctx.moveTo(x, centerY - barHeight / 2)
        ctx.lineTo(x, centerY + barHeight / 2)
        ctx.stroke()
      }

      requestAnimationFrame(drawWaveform)
    }

    drawWaveform()
  }, [state])

  // Auto-start listening when component mounts (optional)
  useEffect(() => {
    // Don't auto-start - let user initiate
  }, [])

  const handleMicClick = () => {
    if (state === 'listening') {
      stopListening()
    } else if (state === 'idle') {
      startListening()
    }
  }

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-red-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'speaking':
        return 'bg-blue-500'
      default:
        return 'bg-green-500'
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return isActive ? 'Listening (conversation active)...' : 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'speaking':
        return 'Speaking...'
      default:
        return isActive ? 'Waiting for your response...' : 'Ready to listen'
    }
  }

  return (
    <div className={`bg-[#1a2332] rounded-2xl p-6 border border-white/5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4F7CFF] to-[#7B5CFF] rounded-xl flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Finly</h3>
            <p className="text-sm text-gray-400">{getStateText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={pauseConversation}
              className="p-2 text-gray-400 hover:text-yellow-400 transition"
              title="Pause conversation"
            >
              <MicOff className="w-4 h-4" />
            </button>
          )}
          {!isActive && state === 'idle' && conversationHistory.length > 0 && (
            <button
              onClick={resumeConversation}
              className="p-2 text-gray-400 hover:text-green-400 transition"
              title="Resume conversation"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={resetConversation}
            className="p-2 text-gray-400 hover:text-white transition"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-400 hover:text-white transition"
            title={showHistory ? 'Hide history' : 'Show history'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Conversation History */}
      {showHistory && conversationHistory.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto space-y-2">
          {conversationHistory.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500/20 ml-8'
                  : 'bg-[#252a41] mr-8'
              }`}
            >
              <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
              {message.metadata?.intent && (
                <p className="text-xs text-gray-400 mt-1">
                  Intent: {message.metadata.intent} ({Math.round((message.metadata.confidence || 0) * 100)}%)
                </p>
              )}
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      )}

      {/* Current Transcript */}
      {currentTranscript && (
        <div className="mb-4 p-3 bg-[#252a41] rounded-lg">
          <p className="text-sm text-gray-400 mb-1">You said:</p>
          <p className="text-white">{currentTranscript}</p>
        </div>
      )}

      {/* Expense Preview - Show when awaiting confirmation */}
      {draft && awaitingConfirmation && (
        <div className="mb-4 p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Expense Preview</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            {/* Editable Amount Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={draft.amount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0 && draftManager) {
                    draftManager.updateField('amount', value);
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>
            
            {/* Editable Vendor Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vendor</label>
              <input
                type="text"
                value={draft.vendor || ''}
                onChange={(e) => {
                  if (draftManager) {
                    draftManager.updateField('vendor', e.target.value);
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                placeholder="Enter vendor name"
              />
            </div>
            
            {/* Editable Category Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <input
                type="text"
                value={draft.category || ''}
                onChange={(e) => {
                  if (draftManager) {
                    draftManager.updateField('category', e.target.value);
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                placeholder="Enter category"
              />
            </div>
            
            {/* Editable Business Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Business</label>
              <input
                type="text"
                value={draft.business || ''}
                onChange={(e) => {
                  if (draftManager) {
                    draftManager.updateField('business', e.target.value);
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                placeholder="Enter business name"
              />
            </div>
            
            {/* Editable Date Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={draft.date ? new Date(draft.date).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (draftManager && e.target.value) {
                    draftManager.updateField('date', e.target.value);
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
              />
            </div>
            
            {/* Editable Priority Field */}
            <div>
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-cyan-400" />
                Priority (Optional)
              </label>
              <select
                value={draft.priority || 'normal'}
                onChange={(e) => {
                  if (draftManager) {
                    draftManager.updateField('priority', e.target.value as 'high' | 'normal' | 'low');
                  }
                }}
                className="w-full bg-[#0f1729]/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <p className="text-sm text-gray-300 mb-3 text-center">
              Review and edit if needed. Say <span className="font-semibold text-green-400">"yes"</span> to confirm or <span className="font-semibold text-red-400">"no"</span> to make changes.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // User can click to confirm, but voice is primary method
                  // This provides accessibility option
                  if (startListening) {
                    // The voice agent will handle the "yes" response
                    await startListening()
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Yes, Confirm
              </button>
              <button
                onClick={async () => {
                  // User can click to reject, but voice is primary method
                  if (startListening) {
                    await startListening()
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                No, Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Visualization */}
      {state === 'listening' && (
        <div className="mb-4 h-16 bg-[#0f1729] rounded-lg overflow-hidden">
          <canvas
            ref={waveformRef}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Main Control */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleMicClick}
          disabled={state === 'processing' || state === 'speaking'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            state === 'listening'
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : state === 'processing' || state === 'speaking'
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857]'
          } ${state === 'processing' || state === 'speaking' ? 'opacity-50' : ''}`}
        >
          {state === 'processing' || state === 'speaking' ? (
            <Loader className="w-8 h-8 text-white animate-spin" />
          ) : state === 'listening' ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStateColor()} ${state === 'listening' ? 'animate-pulse' : ''}`} />
          <p className="text-sm text-gray-400">{getStateText()}</p>
        </div>

        <p className="text-xs text-gray-500 text-center max-w-xs">
          {state === 'idle' && !isActive
            ? 'Click the microphone to start a conversation'
            : state === 'idle' && isActive
            ? 'I\'m ready for your next input...'
            : state === 'listening'
            ? 'Speak naturally. I\'ll automatically continue the conversation.'
            : state === 'processing'
            ? 'Understanding what you said...'
            : 'Speaking response...'}
        </p>
      </div>

      {/* Personality Selector (optional) */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-gray-400 mb-2">Personality:</p>
        <div className="flex gap-2">
          {(['friendly', 'professional', 'analytical'] as PersonalityType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPersonality(p)}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                personality === p
                  ? 'bg-[#4F7CFF] text-white'
                  : 'bg-[#252a41] text-gray-400 hover:text-white'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


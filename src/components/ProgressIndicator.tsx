/**
 * ProgressIndicator Component
 * 
 * Visual progress indicator showing step-by-step progress during expense processing.
 * Displays current step, percentage, estimated time, and animated progress bar.
 * 
 * @component ProgressIndicator
 */

'use client'

import { useEffect, useState } from 'react'
import { Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { ProgressState, ProgressStep } from '../types/progress'
import { progressTracker } from '../services/ProgressTracker'

interface ProgressIndicatorProps {
  progress: ProgressState
  isVoice?: boolean
  className?: string
}

export default function ProgressIndicator({
  progress,
  isVoice = false,
  className = ''
}: ProgressIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState<ProgressState>(progress)

  // Update display progress when prop changes
  useEffect(() => {
    setDisplayProgress(progress)
  }, [progress])

  const getStepIcon = (step: ProgressStep) => {
    switch (step) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
    }
  }

  const getStepColor = (step: ProgressStep) => {
    switch (step) {
      case 'complete':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-cyan-500'
    }
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return '< 1s'
    }
    return `${Math.round(ms / 1000)}s`
  }

  return (
    <div className={`bg-[#1a1d2e] rounded-xl p-4 border border-white/10 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStepIcon(displayProgress.currentStep)}
          <span className="text-sm font-semibold text-gray-300">
            {displayProgress.message}
          </span>
        </div>
        {displayProgress.estimatedTimeRemaining > 0 && (
          <span className="text-xs text-gray-400">
            ~{formatTime(displayProgress.estimatedTimeRemaining)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#252a41] rounded-full h-2 mb-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStepColor(displayProgress.currentStep)}`}
          style={{ width: `${displayProgress.percentage}%` }}
        />
      </div>

      {/* Progress Details */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Step {displayProgress.stepNumber} of {displayProgress.totalSteps}
        </span>
        <span>{displayProgress.percentage}%</span>
      </div>

      {/* Step List (for debugging/development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-xs text-gray-500">
            Current: {displayProgress.currentStep} | 
            Time: {formatTime(Date.now() - displayProgress.startTime)}
          </div>
        </div>
      )}
    </div>
  )
}




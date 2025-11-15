import { useState, useCallback } from 'react'

interface TranscriptionResult {
  text: string
  confidence: number
}

interface ExpenseExtractionResult {
  amount: number
  description: string
  category: string
  business?: string
  date: string
  vendor?: string
  confidence: number
  extractedAt: string
  source: string
  originalText: string
}

interface OCRResult {
  ocrText: string
  expense: ExpenseExtractionResult
  success: boolean
}

interface AITaskResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
}

export function useAIAssistant() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribeAudio = useCallback(async (audioFile: File): Promise<TranscriptionResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioFile)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const result = await response.json()
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const extractExpense = useCallback(async (text: string, businessId?: string): Promise<ExpenseExtractionResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/extract-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          businessId,
          context: {
            // Add any relevant context here
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Expense extraction failed')
      }

      const result = await response.json()
      return result.expense

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Expense extraction failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processReceipt = useCallback(async (imageFile: File): Promise<OCRResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      let attempt = 0
      let lastError: any = null

      while (attempt < 3) {
        const response = await fetch('/api/ocr-receipt', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          return result
        }

        const errorData = await response.json().catch(() => ({} as any))
        if (response.status === 429) {
          const backoff = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
          await new Promise(r => setTimeout(r, backoff))
          attempt += 1
          lastError = new Error(errorData.error || 'OCR service is busy. Please try again in a moment.')
          continue
        }

        lastError = new Error(errorData.error || 'Receipt processing failed')
        break
      }

      throw lastError || new Error('Receipt processing failed')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Receipt processing failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processAITask = useCallback(async (type: 'transcription' | 'extraction' | 'ocr', input: any): Promise<AITaskResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/process-ai-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          input
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI task processing failed')
      }

      const result = await response.json()
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI task processing failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const getTaskStatus = useCallback(async (taskId: string): Promise<AITaskResult> => {
    try {
      const response = await fetch(`/api/process-ai-task?taskId=${taskId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get task status')
      }

      const result = await response.json()
      return result.task

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get task status'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  return {
    isProcessing,
    error,
    transcribeAudio,
    extractExpense,
    processReceipt,
    processAITask,
    getTaskStatus,
    clearError: () => setError(null)
  }
}







export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest } from 'next/server'

/**
 * WebSocket endpoint for real-time voice streaming
 * Note: Next.js doesn't natively support WebSocket in API routes
 * This is a placeholder that would need to be implemented with a WebSocket server
 * or use Server-Sent Events (SSE) as an alternative
 */

export async function GET(request: NextRequest) {
  // For now, return a connection endpoint
  // In production, you'd need to set up a WebSocket server (e.g., using ws library)
  // or use Server-Sent Events for real-time communication
  
  return new Response(
    JSON.stringify({
      message: 'WebSocket endpoint - requires WebSocket server setup',
      note: 'Consider using Server-Sent Events or a separate WebSocket server'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * POST endpoint for audio chunk processing
 * This is an alternative to WebSocket for real-time streaming
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    const isFinal = formData.get('isFinal') === 'true'

    if (!audioBlob) {
      return Response.json(
        { error: 'No audio data provided' },
        { status: 400 }
      )
    }

    // Call OpenAI Whisper API with FormData (required format)
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioBlob, 'recording.webm')
    openaiFormData.append('model', 'whisper-1')
    openaiFormData.append('response_format', 'json')
    openaiFormData.append('language', 'en')
    openaiFormData.append('temperature', '0')

    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: openaiFormData
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', errorData)
      return Response.json(
        { error: 'Transcription failed' },
        { status: 500 }
      )
    }

    const transcriptionResult = await openaiResponse.json()

    return Response.json({
      type: 'transcript',
      text: transcriptionResult.text,
      isFinal: isFinal,
      confidence: transcriptionResult.confidence || 0.9
    })

  } catch (error) {
    console.error('Streaming transcription error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


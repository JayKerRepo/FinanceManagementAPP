export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'

// Valid OpenAI TTS voices
type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'ash' | 'sage' | 'coral'

interface SynthesizeRequest {
  text: string
  voice?: OpenAIVoice
  personality?: 'friendly' | 'professional' | 'analytical'
}

export async function POST(request: NextRequest) {
  try {
    const body: SynthesizeRequest = await request.json()
    const { text, voice, personality = 'friendly' } = body

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Map personality to voice if voice not explicitly provided
    const voiceMap: Record<string, OpenAIVoice> = {
      friendly: 'nova',
      professional: 'onyx',
      analytical: 'echo'
    }

    // If voice is provided directly, use it (must be valid OpenAI voice)
    // Otherwise, map personality to voice
    let selectedVoice: OpenAIVoice
    if (voice) {
      // Validate that the provided voice is a valid OpenAI voice
      const validVoices: OpenAIVoice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral']
      if (validVoices.includes(voice)) {
        selectedVoice = voice
      } else {
        // Invalid voice provided, fall back to personality mapping
        console.warn(`Invalid voice "${voice}" provided, using personality mapping instead`)
        selectedVoice = voiceMap[personality] || 'nova'
      }
    } else {
      // Use personality mapping
      selectedVoice = voiceMap[personality] || 'nova'
    }

    // Call OpenAI TTS API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3'
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI TTS API error:', errorData)
      return NextResponse.json(
        { error: 'Text-to-speech failed' },
        { status: 500 }
      )
    }

    // Return audio as blob
    const audioBuffer = await openaiResponse.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('TTS synthesis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'OCR service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for OpenAI Vision API)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 20MB.' },
        { status: 400 }
      )
    }

    // Convert image to base64 for OpenAI Vision API
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    // Call OpenAI Vision API for OCR
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text from this receipt image. Focus on:
                - Vendor/merchant name
                - Date
                - Items purchased with prices
                - Total amount
                - Tax amount
                - Any other relevant information
                
                Return the extracted text in a structured format.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI Vision API error:', errorData)
      
      // Handle specific error types
      if (openaiResponse.status === 429) {
        return NextResponse.json(
          { error: 'OCR service is busy. Please try again in a moment.' },
          { status: 429 }
        )
      } else if (openaiResponse.status === 401) {
        return NextResponse.json(
          { error: 'OCR service authentication failed. Please contact support.' },
          { status: 500 }
        )
      } else if (openaiResponse.status === 400) {
        return NextResponse.json(
          { error: 'Invalid image format. Please ensure the image is clear and readable.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'OCR processing failed. Please try again or contact support if the issue persists.' },
          { status: 500 }
        )
      }
    }

    const ocrResult = await openaiResponse.json()
    const extractedText = ocrResult.choices[0]?.message?.content

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No text extracted from image' },
        { status: 500 }
      )
    }

    // Now extract expense information from the OCR text (use current request origin)
    const baseUrl = new URL(request.url);
    baseUrl.pathname = '/api/extract-expense';
    const expenseExtractionResponse = await fetch(baseUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: extractedText,
        source: 'receipt'
      })
    })

    if (!expenseExtractionResponse.ok) {
      return NextResponse.json(
        { error: 'Expense extraction from OCR failed' },
        { status: 500 }
      )
    }

    const expenseData = await expenseExtractionResponse.json()

    return NextResponse.json({
      ocrText: extractedText,
      expense: expenseData.expense,
      success: true
    })

  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





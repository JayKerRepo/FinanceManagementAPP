import { NextRequest, NextResponse } from 'next/server'

interface AITask {
  id: string
  type: 'transcription' | 'extraction' | 'ocr'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: any
  result?: any
  error?: string
  createdAt: string
  completedAt?: string
}

// In-memory task storage (replace with database in production)
const taskQueue: AITask[] = []
const processingTasks = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const { type, input } = await request.json()
    
    if (!type || !input) {
      return NextResponse.json(
        { error: 'Missing required fields: type and input' },
        { status: 400 }
      )
    }

    // Create new task
    const task: AITask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      input,
      createdAt: new Date().toISOString()
    }

    taskQueue.push(task)

    // Process task asynchronously
    processTaskAsync(task.id)

    return NextResponse.json({
      taskId: task.id,
      status: 'pending',
      message: 'Task queued for processing'
    })

  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (taskId) {
      // Get specific task
      const task = taskQueue.find(t => t.id === taskId)
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ task })
    } else {
      // Get all tasks
      return NextResponse.json({ tasks: taskQueue })
    }

  } catch (error) {
    console.error('Task retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processTaskAsync(taskId: string) {
  const task = taskQueue.find(t => t.id === taskId)
  if (!task) return

  // Mark as processing
  task.status = 'processing'
  processingTasks.add(taskId)

  try {
    let result

    switch (task.type) {
      case 'transcription':
        result = await processTranscription(task.input)
        break
      case 'extraction':
        result = await processExpenseExtraction(task.input)
        break
      case 'ocr':
        result = await processOCR(task.input)
        break
      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }

    // Update task with result
    task.status = 'completed'
    task.result = result
    task.completedAt = new Date().toISOString()

  } catch (error) {
    console.error(`Task ${taskId} failed:`, error)
    task.status = 'failed'
    task.error = error instanceof Error ? error.message : 'Unknown error'
    task.completedAt = new Date().toISOString()
  } finally {
    processingTasks.delete(taskId)
  }
}

async function processTranscription(input: any) {
  // Simulate transcription processing
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    text: `Transcribed: ${input.audioFileName || 'audio file'}`,
    confidence: 0.95
  }
}

async function processExpenseExtraction(input: any) {
  // Simulate expense extraction processing
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    amount: 25.99,
    description: input.text || 'Extracted expense',
    category: 'office',
    confidence: 0.9
  }
}

async function processOCR(input: any) {
  // Simulate OCR processing
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  return {
    ocrText: `OCR extracted text from ${input.imageFileName || 'image'}`,
    expense: {
      amount: 15.50,
      description: 'Receipt purchase',
      vendor: 'Store Name'
    }
  }
}











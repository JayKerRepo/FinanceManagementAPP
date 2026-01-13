/**
 * Voice Agent Utilities
 * Helper functions for intent recognition, entity extraction, and conversation flow
 */

export type IntentType = 
  | 'expense_entry'
  | 'expense_query'
  | 'invoice_create'
  | 'invoice_query'
  | 'budget_query'
  | 'budget_set'
  | 'report_request'
  | 'insight_request'
  | 'correction'
  | 'confirmation'
  | 'greeting'
  | 'reset'
  | 'unknown'

export interface IntentResult {
  intent: IntentType
  confidence: number
  entities: Record<string, any>
}

/**
 * Recognize user intent from text
 */
export function recognizeIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase().trim()
  
  // Expense entry patterns
  if (
    /(spent|bought|paid|purchased|expense|add|log|record).*\$\d+/.test(lowerText) ||
    /(spent|bought|paid|purchased|expense|add|log|record).*\d+\s*(dollar|dollars)/.test(lowerText) ||
    /\$\d+.*(for|on|at)/.test(lowerText)
  ) {
    return {
      intent: 'expense_entry',
      confidence: 0.9,
      entities: extractExpenseEntities(text)
    }
  }

  // Expense query patterns
  if (
    /(how much|what|show|tell me).*(spent|expense|spending)/.test(lowerText) ||
    /(spending|expenses).*(this|last|month|week|year)/.test(lowerText)
  ) {
    return {
      intent: 'expense_query',
      confidence: 0.85,
      entities: extractQueryEntities(text)
    }
  }

  // Invoice creation patterns
  if (
    /(create|make|generate|send).*(invoice|bill)/.test(lowerText) ||
    /invoice.*(for|to)/.test(lowerText)
  ) {
    return {
      intent: 'invoice_create',
      confidence: 0.9,
      entities: extractInvoiceEntities(text)
    }
  }

  // Invoice query patterns
  if (
    /(show|tell|what).*(invoice|invoices|unpaid|overdue)/.test(lowerText) ||
    /(invoice|invoices).*(status|paid|unpaid)/.test(lowerText)
  ) {
    return {
      intent: 'invoice_query',
      confidence: 0.85,
      entities: {}
    }
  }

  // Budget query patterns
  if (
    /(how|what).*(budget|budgeting)/.test(lowerText) ||
    /(budget).*(status|remaining|left|used)/.test(lowerText) ||
    /(am i|are we).*(over|under).*budget/.test(lowerText)
  ) {
    return {
      intent: 'budget_query',
      confidence: 0.9,
      entities: extractBudgetEntities(text)
    }
  }

  // Budget set patterns
  if (
    /(set|create|make).*budget/.test(lowerText) ||
    /budget.*(of|for)\s*\$\d+/.test(lowerText)
  ) {
    return {
      intent: 'budget_set',
      confidence: 0.85,
      entities: extractBudgetEntities(text)
    }
  }

  // Report request patterns
  if (
    /(show|give|read|generate).*(report|summary|breakdown|analysis)/.test(lowerText) ||
    /(report|summary|breakdown|analysis).*(for|of)/.test(lowerText)
  ) {
    return {
      intent: 'report_request',
      confidence: 0.85,
      entities: extractReportEntities(text)
    }
  }

  // Insight request patterns
  if (
    /(insight|insights|analysis|analyze|recommendation)/.test(lowerText) ||
    /(how can|what should|suggest|recommend)/.test(lowerText)
  ) {
    return {
      intent: 'insight_request',
      confidence: 0.8,
      entities: {}
    }
  }

  // Correction patterns
  if (
    /(actually|wait|no|change|correct|fix|update|edit)/.test(lowerText) ||
    /(that was|it was|it's|it is)/.test(lowerText)
  ) {
    return {
      intent: 'correction',
      confidence: 0.9,
      entities: extractCorrectionEntities(text)
    }
  }

  // Confirmation patterns
  if (
    /(yes|yeah|yep|correct|right|that's right|exactly|confirm)/.test(lowerText) ||
    /(no|nope|wrong|incorrect|that's not)/.test(lowerText)
  ) {
    return {
      intent: 'confirmation',
      confidence: 0.95,
      entities: {
        confirmed: /(yes|yeah|yep|correct|right|that's right|exactly|confirm)/.test(lowerText)
      }
    }
  }

  // Reset patterns (must check before greeting to avoid false positives)
  if (
    /(new expense|start over|reset|clear|begin again|let's add another|add another expense)/.test(lowerText) ||
    /^(new|reset|clear|start over)/.test(lowerText)
  ) {
    return {
      intent: 'reset',
      confidence: 0.95,
      entities: {}
    }
  }

  // Greeting patterns
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening)/.test(lowerText) ||
    /^(what can|how can|help)/.test(lowerText)
  ) {
    return {
      intent: 'greeting',
      confidence: 0.9,
      entities: {}
    }
  }

  // Unknown
  return {
    intent: 'unknown',
    confidence: 0.5,
    entities: {}
  }
}

/**
 * Extract expense entities from text
 */
function extractExpenseEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Extract amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1])
  }

  // Extract vendor (common patterns - prioritize specific patterns first)
  const vendorPatterns = [
    // Hotel names: "at Marriott Hotel" → "Marriott"
    /(?:at|from|for)\s+([A-Z][a-zA-Z]+)\s+Hotel/i,
    // Hotel names: "Marriott Hotel" → "Marriott"
    /([A-Z][a-zA-Z]+)\s+Hotel/i,
    // Generic vendor with type: "at Marriott Restaurant" → "Marriott"
    /(?:at|from|for)\s+([A-Z][a-zA-Z]+)\s+(?:Hotel|Restaurant|Store|Gas|Station)/i,
    // Standard patterns
    /(?:at|from|for)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:for|on|$))/,
    /(?:at|from|for)\s+([A-Z][a-zA-Z]+)/,
  ]
  for (const pattern of vendorPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let vendor = match[1].trim()
      // Post-process: remove common suffixes if present
      vendor = vendor.replace(/\s+(Hotel|Restaurant|Store|Gas\s+Station)$/i, '')
      entities.vendor = vendor
      break
    }
  }

  // Extract category keywords
  const categoryKeywords: Record<string, string[]> = {
    'Travel & Meals': ['gas', 'fuel', 'restaurant', 'lunch', 'dinner', 'coffee', 'starbucks', 'uber', 'lyft', 'hotel', 'flight', 'travel'],
    'Office & Admin': ['office', 'supplies', 'paper', 'printer', 'staples', 'rent', 'utilities'],
    'Marketing': ['advertising', 'ads', 'marketing', 'facebook', 'google ads', 'meta'],
    'Software': ['software', 'subscription', 'saas', 'license', 'app', 'tool'],
    'Professional Services': ['legal', 'accounting', 'consultant', 'lawyer', 'accountant'],
  }

  const lowerText = text.toLowerCase()
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      entities.category = category
      break
    }
  }

  // Extract business name
  const businessMatch = text.match(/(?:for|to)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$)/)
  if (businessMatch) {
    entities.business = businessMatch[1].trim()
  }

  // Extract date references
  if (/(today|yesterday|this week|this month)/.test(text.toLowerCase())) {
    entities.dateReference = text.match(/(today|yesterday|this week|this month)/i)?.[0]
  }

  return entities
}

/**
 * Extract query entities
 */
function extractQueryEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Time period
  if (/(this|last|current)\s+(month|week|year|quarter)/.test(text.toLowerCase())) {
    const match = text.match(/(this|last|current)\s+(month|week|year|quarter)/i)
    if (match) {
      entities.period = match[0]
    }
  }

  // Category
  const categoryMatch = text.match(/(?:for|on|in)\s+([A-Z][a-zA-Z\s]+)/)
  if (categoryMatch) {
    entities.category = categoryMatch[1].trim()
  }

  return entities
}

/**
 * Extract invoice entities
 */
function extractInvoiceEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Client name
  const clientMatch = text.match(/(?:for|to)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$)/)
  if (clientMatch) {
    entities.client = clientMatch[1].trim()
  }

  // Amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1])
  }

  return entities
}

/**
 * Extract budget entities
 */
function extractBudgetEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Category
  const categoryMatch = text.match(/(?:for|on)\s+([A-Z][a-zA-Z\s]+)/)
  if (categoryMatch) {
    entities.category = categoryMatch[1].trim()
  }

  // Amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1])
  }

  return entities
}

/**
 * Extract report entities
 */
function extractReportEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Report type
  if (/monthly|month/.test(text.toLowerCase())) {
    entities.reportType = 'monthly'
  } else if (/weekly|week/.test(text.toLowerCase())) {
    entities.reportType = 'weekly'
  } else if (/quarterly|quarter/.test(text.toLowerCase())) {
    entities.reportType = 'quarterly'
  } else if (/annual|yearly|year/.test(text.toLowerCase())) {
    entities.reportType = 'annual'
  }

  // Time period
  if (/(this|last|current)\s+(month|week|year|quarter)/.test(text.toLowerCase())) {
    const match = text.match(/(this|last|current)\s+(month|week|year|quarter)/i)
    if (match) {
      entities.period = match[0]
    }
  }

  return entities
}

/**
 * Extract correction entities
 */
function extractCorrectionEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // What to correct
  if (/amount|price|cost/.test(text.toLowerCase())) {
    entities.field = 'amount'
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
    if (amountMatch) {
      entities.newValue = parseFloat(amountMatch[1])
    }
  } else if (/category|type/.test(text.toLowerCase())) {
    entities.field = 'category'
    const categoryMatch = text.match(/(?:as|to|is)\s+([A-Z][a-zA-Z\s]+)/)
    if (categoryMatch) {
      entities.newValue = categoryMatch[1].trim()
    }
  } else if (/vendor|merchant|store/.test(text.toLowerCase())) {
    entities.field = 'vendor'
    const vendorMatch = text.match(/(?:at|from|is)\s+([A-Z][a-zA-Z\s]+)/)
    if (vendorMatch) {
      entities.newValue = vendorMatch[1].trim()
    }
  } else if (/date|when/.test(text.toLowerCase())) {
    entities.field = 'date'
    const dateMatch = text.match(/(today|yesterday|this week|this month|\d{4}-\d{2}-\d{2})/i)
    if (dateMatch) {
      entities.newValue = dateMatch[0]
    }
  }

  return entities
}

/**
 * Format response text
 */
export function formatResponse(text: string, options?: {
  includePunctuation?: boolean
  capitalize?: boolean
}): string {
  let formatted = text.trim()

  if (options?.capitalize) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  if (options?.includePunctuation && !/[.!?]$/.test(formatted)) {
    formatted += '.'
  }

  return formatted
}

/**
 * Check if text indicates end of conversation
 */
export function isConversationEnd(text: string): boolean {
  const lowerText = text.toLowerCase().trim()
  return /^(thanks|thank you|bye|goodbye|done|finished|that's all|that's it)$/.test(lowerText)
}

/**
 * Check if text is a question
 */
export function isQuestion(text: string): boolean {
  return text.trim().endsWith('?') || 
         /^(what|where|when|why|how|who|which|can|could|would|should|is|are|do|does|did)/i.test(text.trim())
}



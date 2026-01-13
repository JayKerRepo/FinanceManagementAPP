/**
 * TokenOptimizer
 * 
 * Optimizes OpenAI API token usage to minimize costs while maintaining quality.
 * Implements caching, prompt compression, and token tracking.
 * 
 * Strategies:
 * - Smart model selection with automatic fallbacks
 * - Compress system prompts (remove redundancy)
 * - Cache common responses
 * - Limit conversation history
 * - Use function calling for structured outputs
 * - Optimize temperature settings
 * 
 * @class TokenOptimizer
 */

interface CacheEntry {
  response: string
  timestamp: number
  tokens: number
}

interface TokenUsage {
  operation: string
  tokens: number
  timestamp: number
}

interface ModelAvailability {
  model: string
  available: boolean
  lastChecked: number
}

export class TokenOptimizer {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly cacheTTL = 5 * 60 * 1000 // 5 minutes
  private tokenUsageLog: TokenUsage[] = []
  private readonly maxCacheSize = 100
  
  // Model availability cache (5 minute TTL)
  private modelAvailabilityCache: Map<string, ModelAvailability> = new Map()
  private readonly modelCacheTTL = 5 * 60 * 1000 // 5 minutes

  // Model preference chains for different operations
  private readonly modelChains = {
    conversation: [
      'gpt-4o-mini',      // Best: Fast, cheap, great for chat
      'gpt-4o',            // Fallback 1: More capable
      'gpt-3.5-turbo',     // Fallback 2: Reliable backup
      'gpt-4-turbo'        // Fallback 3: Last resort
    ],
    extraction: [
      'gpt-4o-mini',      // Best: Fast, cheap, great for structured extraction
      'gpt-4o',            // Fallback 1: More capable
      'gpt-3.5-turbo',     // Fallback 2: Reliable backup
      'gpt-4-turbo'        // Fallback 3: Last resort
    ],
    vision: [
      'gpt-4o',            // Best: Excellent vision capabilities
      'gpt-4o-mini',       // Fallback 1: Good vision, cheaper
      'gpt-4-turbo'        // Fallback 2: Alternative vision model
    ],
    transcription: [
      'whisper-1'          // Only option for audio transcription
    ]
  }

  /**
   * Optimize system prompt by removing redundancy
   * @param prompt - Original system prompt
   * @returns Compressed prompt
   */
  optimizePrompt(prompt: string): string {
    // Remove extra whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim()

    // Remove redundant phrases
    const redundantPhrases = [
      /You are an AI assistant that/gi,
      /You must always/gi,
      /It is important that/gi
    ]

    for (const phrase of redundantPhrases) {
      optimized = optimized.replace(phrase, '')
    }

    // Remove duplicate sentences
    const sentences = optimized.split(/[.!?]+/).filter(s => s.trim())
    const uniqueSentences = Array.from(new Set(sentences.map(s => s.trim())))
    optimized = uniqueSentences.join('. ') + '.'

    return optimized.trim()
  }

  /**
   * Check if request should be cached
   * @param request - Request string/key
   * @returns True if cacheable
   */
  shouldCache(request: string): boolean {
    // Cache common questions and responses
    const cacheablePatterns = [
      /^(hi|hello|hey|thanks|thank you)$/i,
      /^(what|how|when|where|why)/i,
      /^(yes|no|yep|nope|sure|ok|okay)$/i
    ]

    return cacheablePatterns.some(pattern => pattern.test(request))
  }

  /**
   * Get cached response if available
   * @param key - Cache key
   * @returns Cached response or null
   */
  getCachedResponse(key: string): string | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if cache entry is still valid
    const now = Date.now()
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return entry.response
  }

  /**
   * Store response in cache
   * @param key - Cache key
   * @param response - Response to cache
   * @param tokens - Token count used
   */
  setCachedResponse(key: string, response: string, tokens: number): void {
    // Limit cache size
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      tokens
    })
  }

  /**
   * Track token usage for monitoring
   * @param operation - Operation name
   * @param tokens - Number of tokens used
   */
  trackTokenUsage(operation: string, tokens: number): void {
    this.tokenUsageLog.push({
      operation,
      tokens,
      timestamp: Date.now()
    })

    // Keep only last 1000 entries
    if (this.tokenUsageLog.length > 1000) {
      this.tokenUsageLog = this.tokenUsageLog.slice(-1000)
    }

    // Log if usage is high
    if (tokens > 2000) {
      console.warn(`High token usage: ${operation} used ${tokens} tokens`)
    }
  }

  /**
   * Get token usage statistics
   * @param timeWindow - Time window in milliseconds (default: 1 hour)
   * @returns Usage statistics
   */
  getTokenUsageStats(timeWindow: number = 60 * 60 * 1000): {
    total: number
    average: number
    operations: Record<string, number>
  } {
    const now = Date.now()
    const recent = this.tokenUsageLog.filter(
      entry => now - entry.timestamp < timeWindow
    )

    const total = recent.reduce((sum, entry) => sum + entry.tokens, 0)
    const average = recent.length > 0 ? total / recent.length : 0

    const operations: Record<string, number> = {}
    recent.forEach(entry => {
      operations[entry.operation] = (operations[entry.operation] || 0) + entry.tokens
    })

    return {
      total,
      average,
      operations
    }
  }

  /**
   * Limit conversation history to reduce tokens
   * @param history - Full conversation history
   * @param maxMessages - Maximum messages to keep
   * @returns Limited history
   */
  limitHistory(
    history: Array<{ role: string; content: string }>,
    maxMessages: number = 5
  ): Array<{ role: string; content: string }> {
    // Keep system message if present, then last N messages
    const systemMessage = history.find(m => m.role === 'system')
    const recentMessages = history
      .filter(m => m.role !== 'system')
      .slice(-maxMessages)

    return systemMessage
      ? [systemMessage, ...recentMessages]
      : recentMessages
  }

  /**
   * Check if a model is available by making a lightweight test request
   * @param model - Model name to check
   * @returns Promise<boolean> - True if model is available
   */
  private async checkModelAvailability(model: string): Promise<boolean> {
    // Check cache first
    const cached = this.modelAvailabilityCache.get(model)
    if (cached) {
      const now = Date.now()
      if (now - cached.lastChecked < this.modelCacheTTL) {
        return cached.available
      }
    }

    // If no API key, can't check - assume available
    if (!process.env.OPENAI_API_KEY) {
      return true
    }

    try {
      // Make a minimal test request to check model availability
      const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      })

      const isAvailable = testResponse.ok
      
      // Cache the result
      this.modelAvailabilityCache.set(model, {
        model,
        available: isAvailable,
        lastChecked: Date.now()
      })

      return isAvailable
    } catch (error) {
      console.warn(`Error checking model availability for ${model}:`, error)
      // On error, assume not available
      this.modelAvailabilityCache.set(model, {
        model,
        available: false,
        lastChecked: Date.now()
      })
      return false
    }
  }

  /**
   * Get the best available model for an operation with automatic fallback
   * @param operation - Operation type
   * @param skipCheck - Skip availability check (use cached or first in chain)
   * @returns Promise<string> - Available model name
   */
  async getOptimalModel(
    operation: 'extraction' | 'conversation' | 'transcription' | 'vision',
    skipCheck: boolean = false
  ): Promise<string> {
    const chain = this.modelChains[operation] || this.modelChains.conversation

    // For transcription, return immediately (no fallback needed)
    if (operation === 'transcription') {
      return chain[0]
    }

    // If skipCheck is true, return first model in chain (for synchronous calls)
    if (skipCheck) {
      return chain[0]
    }

    // Check each model in the chain until we find an available one
    for (const model of chain) {
      const isAvailable = await this.checkModelAvailability(model)
      if (isAvailable) {
        return model
      }
    }

    // If all models fail, return the first one anyway (will handle error at call site)
    console.warn(`All models unavailable for ${operation}, using first in chain: ${chain[0]}`)
    return chain[0]
  }

  /**
   * Synchronous version - returns first model in chain (for backwards compatibility)
   * Use getOptimalModel() with await for smart selection
   * @param operation - Operation type
   * @returns Model name (first in preference chain)
   */
  getOptimalModelSync(operation: 'extraction' | 'conversation' | 'transcription' | 'vision'): string {
    const chain = this.modelChains[operation] || this.modelChains.conversation
    return chain[0]
  }

  /**
   * Get optimal model with retry logic - tries models in order until one works
   * @param operation - Operation type
   * @param requestFn - Function that makes the API call with a model parameter
   * @returns Promise with result from first successful model
   */
  async callWithModelFallback<T>(
    operation: 'extraction' | 'conversation' | 'transcription' | 'vision',
    requestFn: (model: string) => Promise<T>
  ): Promise<T> {
    const chain = this.modelChains[operation] || this.modelChains.conversation
    const errors: Array<{ model: string; error: any }> = []

    for (const model of chain) {
      try {
        const result = await requestFn(model)
        // If successful, cache that this model works
        this.modelAvailabilityCache.set(model, {
          model,
          available: true,
          lastChecked: Date.now()
        })
        return result
      } catch (error: any) {
        errors.push({ model, error })
        
        // Check if it's a model_not_found error
        const errorMessage = error?.message || JSON.stringify(error)
        const errorData = error?.error || error
        
        if (
          errorData?.code === 'model_not_found' ||
          errorMessage.includes('model_not_found') ||
          errorMessage.includes('does not exist')
        ) {
          // Mark model as unavailable
          this.modelAvailabilityCache.set(model, {
            model,
            available: false,
            lastChecked: Date.now()
          })
          // Continue to next model
          continue
        }
        
        // For other errors (rate limit, etc.), also try next model
        console.warn(`Model ${model} failed for ${operation}:`, error)
        continue
      }
    }

    // If all models failed, throw the last error
    const lastError = errors[errors.length - 1]
    throw new Error(
      `All models failed for ${operation}. Last error from ${lastError.model}: ${lastError.error?.message || lastError.error}`
    )
  }

  /**
   * Get optimal temperature for operation
   * @param operation - Operation type
   * @returns Temperature value
   */
  getOptimalTemperature(operation: 'extraction' | 'conversation'): number {
    switch (operation) {
      case 'extraction':
        // Low temperature for consistent extraction
        return 0.1
      case 'conversation':
        // Higher temperature for natural conversation
        return 0.7
      default:
        return 0.5
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear token usage log
   */
  clearUsageLog(): void {
    this.tokenUsageLog = []
  }
}

// Export singleton instance
export const tokenOptimizer = new TokenOptimizer()


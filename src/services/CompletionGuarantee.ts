/**
 * CompletionGuarantee
 * 
 * Ensures expense is saved before marking as complete.
 * Implements retry mechanism and transaction logging.
 * 
 * @class CompletionGuarantee
 */

import { ExpenseDraft } from './interfaces/IExpenseDraftManager'

export interface SaveResult {
  success: boolean
  transactionId?: string
  error?: string
  retries?: number
}

export interface TransactionLog {
  expense: ExpenseDraft
  timestamp: number
  status: 'success' | 'failed'
  retries: number
  error?: string
}

export class CompletionGuarantee {
  private transactionLog: TransactionLog[] = []
  private saveCallback?: (expense: ExpenseDraft) => Promise<boolean>

  /**
   * Set callback function for saving expense
   * @param callback - Async function that saves expense and returns true on success
   */
  setSaveCallback(callback: (expense: ExpenseDraft) => Promise<boolean>): void {
    this.saveCallback = callback
  }

  /**
   * Ensure expense is saved with retry mechanism
   * @param expense - Expense draft to save
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Save result with success status
   */
  async ensureExpenseSaved(
    expense: ExpenseDraft,
    maxRetries: number = 3
  ): Promise<SaveResult> {
    if (!this.saveCallback) {
      throw new Error('Save callback not set. Cannot ensure completion.')
    }

    let attempts = 0
    let lastError: string | undefined

    while (attempts < maxRetries) {
      attempts++

      try {
        const success = await this.saveCallback(expense)

        if (success) {
          // Log successful save
          this.logTransaction(expense, 'success', attempts - 1)

          return {
            success: true,
            transactionId: this.generateTransactionId(),
            retries: attempts - 1
          }
        } else {
          lastError = 'Save callback returned false'
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Save attempt ${attempts} failed:`, lastError)
      }

      // Wait before retry (exponential backoff)
      if (attempts < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
        await this.sleep(delay)
      }
    }

    // All retries failed
    this.logTransaction(expense, 'failed', attempts, lastError)

    return {
      success: false,
      error: lastError || 'Max retries exceeded',
      retries: attempts
    }
  }

  /**
   * Retry save operation
   * @param expense - Expense draft to save
   * @param maxRetries - Maximum retry attempts
   * @returns True if save succeeds
   */
  async retrySave(
    expense: ExpenseDraft,
    maxRetries: number = 3
  ): Promise<boolean> {
    const result = await this.ensureExpenseSaved(expense, maxRetries)
    return result.success
  }

  /**
   * Log transaction for audit trail
   * @param expense - Expense that was saved/failed
   * @param status - Transaction status
   * @param retries - Number of retries attempted
   * @param error - Error message if failed
   */
  logTransaction(
    expense: ExpenseDraft,
    status: 'success' | 'failed',
    retries: number,
    error?: string
  ): void {
    this.transactionLog.push({
      expense: { ...expense },
      timestamp: Date.now(),
      status,
      retries,
      error
    })

    // Keep only last 1000 transactions
    if (this.transactionLog.length > 1000) {
      this.transactionLog = this.transactionLog.slice(-1000)
    }
  }

  /**
   * Get transaction log
   * @param limit - Maximum number of transactions to return
   * @returns Array of transaction logs
   */
  getTransactionLog(limit: number = 100): TransactionLog[] {
    return this.transactionLog.slice(-limit)
  }

  /**
   * Generate unique transaction ID
   * @returns Transaction ID string
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const completionGuarantee = new CompletionGuarantee()




/**
 * IExpenseDraftManager Interface
 * 
 * Defines the contract for managing expense draft state across conversation turns.
 * Ensures incremental updates, completion tracking, and prevents data loss.
 * 
 * @interface IExpenseDraftManager
 */

export interface ExpenseDraft {
  amount?: number | null
  vendor?: string | null
  category?: string | null
  business?: string | null
  date?: string | null
  payment_method?: string | null
  description?: string | null
  tax_deductible?: boolean | null
  receipt_url?: string | null
  priority?: 'high' | 'normal' | 'low' | null
}

export interface CompletionStatus {
  isComplete: boolean
  missingFields: string[]
  hasBeenSaved: boolean
  completionPercentage: number
}

export interface IExpenseDraftManager {
  /**
   * Update a specific field in the draft without clearing others
   * @param field - The field to update
   * @param value - The new value for the field
   */
  updateField(field: keyof ExpenseDraft, value: any): void

  /**
   * Get all missing required fields
   * @param required - Array of required field names
   * @returns Array of missing field names
   */
  getMissingFields(required: string[]): string[]

  /**
   * Check if a field has been asked about
   * @param field - The field name to check
   * @returns True if field has been asked
   */
  hasBeenAsked(field: string): boolean

  /**
   * Mark a field as having been asked
   * @param field - The field name to mark
   */
  markAsAsked(field: string): void

  /**
   * Check if draft is complete with all required fields
   * @param required - Array of required field names
   * @returns True if all required fields are present
   */
  isComplete(required: string[]): boolean

  /**
   * Get current completion status
   * @param required - Array of required field names
   * @returns Completion status object
   */
  getCompletionStatus(required: string[]): CompletionStatus

  /**
   * Mark draft as complete (only after successful save)
   */
  markAsComplete(): void

  /**
   * Ensure expense is saved before marking complete
   * @returns Promise resolving to true if saved successfully
   */
  ensureCompletion(): Promise<boolean>

  /**
   * Reset draft state (only on explicit user request)
   */
  reset(): void

  /**
   * Get current draft state
   * @returns Current expense draft
   */
  getDraft(): ExpenseDraft

  /**
   * Get all fields that have been asked about
   * @returns Set of asked field names
   */
  getAskedFields(): Set<string>
}



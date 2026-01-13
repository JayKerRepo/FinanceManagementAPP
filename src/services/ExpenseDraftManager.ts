/**
 * ExpenseDraftManager
 * 
 * Manages expense draft state across conversation turns with incremental updates,
 * completion tracking, and guarantee that expenses are saved before marking complete.
 * 
 * Follows IExpenseDraftManager interface for maintainability and testability.
 * 
 * @class ExpenseDraftManager
 * @implements {IExpenseDraftManager}
 */

import {
  IExpenseDraftManager,
  ExpenseDraft,
  CompletionStatus
} from './interfaces/IExpenseDraftManager'

export class ExpenseDraftManager implements IExpenseDraftManager {
  private draft: ExpenseDraft
  private askedFields: Set<string>
  private isSaved: boolean
  private saveCallback?: () => Promise<boolean>

  constructor(initialDraft?: Partial<ExpenseDraft>) {
    this.draft = {
      amount: null,
      vendor: null,
      category: null,
      business: null,
      date: null,
      payment_method: null,
      description: null,
      tax_deductible: null,
      receipt_url: null,
      ...initialDraft
    }
    this.askedFields = new Set<string>()
    this.isSaved = false
  }

  /**
   * Update a specific field in the draft without clearing others
   * @param field - The field to update
   * @param value - The new value for the field
   */
  updateField(field: keyof ExpenseDraft, value: any): void {
    // Only update if value is not null/undefined
    if (value !== null && value !== undefined) {
      this.draft[field] = value as any
    }
  }

  /**
   * Get all missing required fields
   * @param required - Array of required field names
   * @returns Array of missing field names
   */
  getMissingFields(required: string[]): string[] {
    return required.filter(field => {
      const value = this.draft[field as keyof ExpenseDraft]
      return value === null || value === undefined || value === ''
    })
  }

  /**
   * Check if a field has been asked about
   * @param field - The field name to check
   * @returns True if field has been asked
   */
  hasBeenAsked(field: string): boolean {
    return this.askedFields.has(field)
  }

  /**
   * Mark a field as having been asked
   * @param field - The field name to mark
   */
  markAsAsked(field: string): void {
    this.askedFields.add(field)
  }

  /**
   * Check if draft is complete with all required fields
   * @param required - Array of required field names
   * @returns True if all required fields are present
   */
  isComplete(required: string[]): boolean {
    const missing = this.getMissingFields(required)
    return missing.length === 0
  }

  /**
   * Get current completion status
   * @param required - Array of required field names
   * @returns Completion status object
   */
  getCompletionStatus(required: string[]): CompletionStatus {
    const missing = this.getMissingFields(required)
    const total = required.length
    const completed = total - missing.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      isComplete: missing.length === 0,
      missingFields: missing,
      hasBeenSaved: this.isSaved,
      completionPercentage: percentage
    }
  }

  /**
   * Mark draft as complete (only after successful save)
   */
  markAsComplete(): void {
    if (this.isSaved) {
      // Draft is already saved, can mark as complete
      // This is called after ensureCompletion succeeds
    } else {
      throw new Error('Cannot mark as complete: expense not saved yet')
    }
  }

  /**
   * Set callback function for saving expense
   * @param callback - Async function that returns true if save succeeds
   */
  setSaveCallback(callback: () => Promise<boolean>): void {
    this.saveCallback = callback
  }

  /**
   * Ensure expense is saved before marking complete
   * @returns Promise resolving to true if saved successfully
   */
  async ensureCompletion(): Promise<boolean> {
    if (this.isSaved) {
      return true
    }

    if (!this.saveCallback) {
      throw new Error('Save callback not set. Cannot ensure completion.')
    }

    try {
      const success = await this.saveCallback()
      if (success) {
        this.isSaved = true
        return true
      }
      return false
    } catch (error) {
      console.error('Error ensuring completion:', error)
      return false
    }
  }

  /**
   * Reset draft state (only on explicit user request)
   */
  reset(): void {
    this.draft = {
      amount: null,
      vendor: null,
      category: null,
      business: null,
      date: null,
      payment_method: null,
      description: null,
      tax_deductible: null,
      receipt_url: null
    }
    this.askedFields.clear()
    this.isSaved = false
  }

  /**
   * Get current draft state
   * @returns Current expense draft (immutable copy)
   */
  getDraft(): ExpenseDraft {
    return { ...this.draft }
  }

  /**
   * Get all fields that have been asked about
   * @returns Set of asked field names
   */
  getAskedFields(): Set<string> {
    return new Set(this.askedFields)
  }

  /**
   * Check if expense has been saved
   * @returns True if expense has been saved
   */
  getSavedStatus(): boolean {
    return this.isSaved
  }
}







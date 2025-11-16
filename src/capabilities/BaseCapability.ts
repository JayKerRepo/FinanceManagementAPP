/**
 * BaseCapability Interface
 * 
 * Base interface for all capability handlers.
 * Ensures consistent structure across all capabilities.
 * 
 * @interface IBaseCapability
 */

import { ExpenseDraft } from '../services/interfaces/IExpenseDraftManager'

export type AgentAction =
  | { action: 'interpret'; draft: ExpenseDraft; needs_followup: string[]; assistant_message: string }
  | { action: 'request_more_info'; missing: string[]; assistant_message: string }
  | { action: 'create_expense'; data: ExpenseDraft; assistant_message: string }
  | { action: 'update_draft'; updated_fields: Partial<ExpenseDraft>; assistant_message: string }
  | { action: 'create_invoice'; data: any; assistant_message: string }
  | { action: 'budget_query'; data: any; assistant_message: string }
  | { action: 'read_report'; data: any; assistant_message: string }
  | { action: 'proactive_insight'; insight: any; assistant_message: string }

export interface CapabilityContext {
  user?: {
    id: string
    email: string
  }
  businessId?: string
  businesses?: Array<{ id: string; name: string }>
  conversationHistory?: Array<{ role: string; content: string }>
  draft?: ExpenseDraft
  personality?: 'friendly' | 'professional' | 'analytical' | 'coaching'
}

export interface IBaseCapability {
  /**
   * Handle capability-specific operation
   * @param input - User input text
   * @param context - Capability context
   * @returns Agent action response
   */
  handle(input: string, context: CapabilityContext): Promise<AgentAction>

  /**
   * Get capability name
   * @returns Capability name
   */
  getName(): string

  /**
   * Check if capability can handle the input
   * @param input - User input text
   * @returns True if capability can handle
   */
  canHandle(input: string): boolean
}




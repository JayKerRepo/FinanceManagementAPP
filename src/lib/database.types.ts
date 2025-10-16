export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          onboarding_completed: boolean
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          name: string
          business_type: string
          tax_id: string | null
          address: Json
          is_default: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          business_type?: string
          tax_id?: string | null
          address?: Json
          is_default?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          business_type?: string
          tax_id?: string | null
          address?: Json
          is_default?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          business_id: string
          name: string
          account_type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
          bank_name: string | null
          account_number: string | null
          balance: number
          currency: string
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          account_type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
          bank_name?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          account_type?: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
          bank_name?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          business_id: string
          account_id: string
          transaction_type: 'income' | 'expense' | 'transfer'
          amount: number
          currency: string
          description: string | null
          category: string | null
          date: string
          is_tax_deductible: boolean
          is_recurring: boolean
          recurring_config: Json | null
          receipt_url: string | null
          notes: string | null
          split_config: Json | null
          tags: string[]
          ai_category: string | null
          ai_confidence: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          account_id: string
          transaction_type: 'income' | 'expense' | 'transfer'
          amount: number
          currency?: string
          description?: string | null
          category?: string | null
          date?: string
          is_tax_deductible?: boolean
          is_recurring?: boolean
          recurring_config?: Json | null
          receipt_url?: string | null
          notes?: string | null
          split_config?: Json | null
          tags?: string[]
          ai_category?: string | null
          ai_confidence?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          account_id?: string
          transaction_type?: 'income' | 'expense' | 'transfer'
          amount?: number
          currency?: string
          description?: string | null
          category?: string | null
          date?: string
          is_tax_deductible?: boolean
          is_recurring?: boolean
          recurring_config?: Json | null
          receipt_url?: string | null
          notes?: string | null
          split_config?: Json | null
          tags?: string[]
          ai_category?: string | null
          ai_confidence?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          business_id: string | null
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          parent_id: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          business_id: string
          category: string
          amount_limit: number
          period_type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          period_start: string
          period_end: string
          alert_threshold: number
          is_active: boolean
          rollover_unused: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category: string
          amount_limit: number
          period_type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          period_start: string
          period_end: string
          alert_threshold?: number
          is_active?: boolean
          rollover_unused?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category?: string
          amount_limit?: number
          period_type?: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          period_start?: string
          period_end?: string
          alert_threshold?: number
          is_active?: boolean
          rollover_unused?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          transaction_id: string
          file_url: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          file_url: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          file_url?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

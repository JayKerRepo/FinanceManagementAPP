export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface UserPreferences {
  currency: string
  language: string
  timezone: string
  defaultView: 'dashboard' | 'expenses' | 'reports'
  defaultBusinessId: string | 'recent'
  autoOpenExpenseEntry: boolean
}

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
          name: string
          business_type: string
          tax_id: string | null
          address: Json
          settings: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_type?: string
          tax_id?: string | null
          address?: Json
          settings?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_type?: string
          tax_id?: string | null
          address?: Json
          settings?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'accountant' | 'employee' | 'viewer'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'accountant' | 'employee' | 'viewer'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'manager' | 'accountant' | 'employee' | 'viewer'
          created_at?: string
          updated_at?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      expense_approvals: {
        Row: {
          id: string
          business_id: string
          transaction_id: string
          submitter_id: string
          approver_id: string | null
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approval_level: number | null
          total_levels: number | null
          submitted_at: string
          reviewed_at: string | null
          comments: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          transaction_id: string
          submitter_id: string
          approver_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approval_level?: number | null
          total_levels?: number | null
          submitted_at?: string
          reviewed_at?: string | null
          comments?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          transaction_id?: string
          submitter_id?: string
          approver_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approval_level?: number | null
          total_levels?: number | null
          submitted_at?: string
          reviewed_at?: string | null
          comments?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string | null
          address: Json
          contact_person: string | null
          tax_id: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: Json
          contact_person?: string | null
          tax_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: Json
          contact_person?: string | null
          tax_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          invoice_number: string | null
          status: string | null
          issue_date: string | null
          due_date: string | null
          subtotal: number | null
          tax_rate: number | null
          tax_amount: number | null
          discount: number | null
          total_amount: number | null
          paid_amount: number | null
          currency: string | null
          line_items: Json | null
          notes: string | null
          terms: string | null
          is_recurring: boolean | null
          recurring_config: Json | null
          template_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id?: string | null
          invoice_number?: string | null
          status?: string | null
          issue_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          tax_rate?: number | null
          tax_amount?: number | null
          discount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          currency?: string | null
          line_items?: Json | null
          notes?: string | null
          terms?: string | null
          is_recurring?: boolean | null
          recurring_config?: Json | null
          template_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string | null
          invoice_number?: string | null
          status?: string | null
          issue_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          tax_rate?: number | null
          tax_amount?: number | null
          discount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          currency?: string | null
          line_items?: Json | null
          notes?: string | null
          terms?: string | null
          is_recurring?: boolean | null
          recurring_config?: Json | null
          template_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          payment_date?: string
          amount: number
          payment_method: string
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string
          reference?: string | null
          notes?: string | null
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

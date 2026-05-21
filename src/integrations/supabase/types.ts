export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          currency: string | null
          current_value: number
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_value?: number
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_value?: number
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          prompt_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          prompt_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          prompt_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          due_date: string
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          name: string
          recurrence_period: string | null
          updated_at: string
          user_id: string
          auto_pay: boolean | null
          account_id: string | null
          last_auto_processed_at: string | null
          type: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          name: string
          recurrence_period?: string | null
          updated_at?: string
          user_id: string
          auto_pay?: boolean | null
          account_id?: string | null
          last_auto_processed_at?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          name?: string
          recurrence_period?: string | null
          updated_at?: string
          user_id?: string
          auto_pay?: boolean | null
          account_id?: string | null
          last_auto_processed_at?: string | null
          type?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          month: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          month: string
          monthly_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          month?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          balance: number
          bank_name: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          interest_rate: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type: string
          balance?: number
          bank_name: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          interest_rate?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          balance?: number
          bank_name?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          interest_rate?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          transaction_count: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          transaction_count?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          transaction_count?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          annual_fee: number | null
          card_type: string
          created_at: string
          credit_limit: number
          current_balance: number
          description: string | null
          id: string
          interest_rate: number
          issuer: string
          last_four_digits: string | null
          minimum_payment: number | null
          payment_due_date: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_fee?: number | null
          card_type: string
          created_at?: string
          credit_limit: number
          current_balance?: number
          description?: string | null
          id?: string
          interest_rate?: number
          issuer: string
          last_four_digits?: string | null
          minimum_payment?: number | null
          payment_due_date?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_fee?: number | null
          card_type?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          description?: string | null
          id?: string
          interest_rate?: number
          issuer?: string
          last_four_digits?: string | null
          minimum_payment?: number | null
          payment_due_date?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_briefs: {
        Row: {
          action_count: number
          brief_date: string
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json
          status: string
          top_action_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_count?: number
          brief_date?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          top_action_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_count?: number
          brief_date?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          top_action_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_health_history: {
        Row: {
          created_at: string | null
          credit_score: number | null
          credit_utilization: number | null
          date: string
          debt_score: number | null
          debt_to_income_ratio: number | null
          emergency_fund_months: number | null
          emergency_fund_score: number | null
          id: string
          net_worth: number | null
          overall_score: number
          savings_rate: number | null
          savings_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_score?: number | null
          credit_utilization?: number | null
          date?: string
          debt_score?: number | null
          debt_to_income_ratio?: number | null
          emergency_fund_months?: number | null
          emergency_fund_score?: number | null
          id?: string
          net_worth?: number | null
          overall_score: number
          savings_rate?: number | null
          savings_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_score?: number | null
          credit_utilization?: number | null
          date?: string
          debt_score?: number | null
          debt_to_income_ratio?: number | null
          emergency_fund_months?: number | null
          emergency_fund_score?: number | null
          id?: string
          net_worth?: number | null
          overall_score?: number
          savings_rate?: number | null
          savings_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          notes: string | null
          source_name: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          source_name: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          source_name?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          beneficiaries: string | null
          coverage_amount: number | null
          created_at: string
          currency: string
          end_date: string | null
          id: string
          last_paid_date: string | null
          next_payment_date: string | null
          notes: string | null
          payment_status: string | null
          policy_name: string
          policy_number: string | null
          policy_type: string
          premium_amount: number
          premium_frequency: string | null
          provider: string
          renewal_date: string | null
          start_date: string
          status: string | null
          tax_deductible: boolean | null
          tax_deduction_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beneficiaries?: string | null
          coverage_amount?: number | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          last_paid_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          payment_status?: string | null
          policy_name: string
          policy_number?: string | null
          policy_type: string
          premium_amount: number
          premium_frequency?: string | null
          provider: string
          renewal_date?: string | null
          start_date: string
          status?: string | null
          tax_deductible?: boolean | null
          tax_deduction_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beneficiaries?: string | null
          coverage_amount?: number | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          last_paid_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          payment_status?: string | null
          policy_name?: string
          policy_number?: string | null
          policy_type?: string
          premium_amount?: number
          premium_frequency?: string | null
          provider?: string
          renewal_date?: string | null
          start_date?: string
          status?: string | null
          tax_deductible?: boolean | null
          tax_deduction_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          account_number: string | null
          account_type: string | null
          api_key: string | null
          avg_cost: number | null
          avg_price: number | null
          balance: number | null
          bond_type: string | null
          broker: string | null
          business_name: string | null
          company_name: string | null
          coupon_rate: number | null
          created_at: string
          currency: string | null
          current_nav: number | null
          current_price: number | null
          current_value: number | null
          description: string | null
          equity: number | null
          exchange: string | null
          face_value: number | null
          fund_category: string | null
          fund_code: string | null
          fund_house: string | null
          id: string
          initial_investment: number | null
          investment_date: string | null
          investment_type: string
          issuer: string | null
          last_sync: string | null
          maturity_date: string | null
          mt_account_number: string | null
          mt_broker: string | null
          mt_platform: string | null
          mt_server: string | null
          name: string
          ownership_percent: number | null
          profit_loss: number | null
          sector: string | null
          shares: number | null
          status: string | null
          symbol: string | null
          sync_status: string | null
          this_year_contribution: number | null
          units: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          avg_cost?: number | null
          avg_price?: number | null
          balance?: number | null
          bond_type?: string | null
          broker?: string | null
          business_name?: string | null
          company_name?: string | null
          coupon_rate?: number | null
          created_at?: string
          currency?: string | null
          current_nav?: number | null
          current_price?: number | null
          current_value?: number | null
          description?: string | null
          equity?: number | null
          exchange?: string | null
          face_value?: number | null
          fund_category?: string | null
          fund_code?: string | null
          fund_house?: string | null
          id?: string
          initial_investment?: number | null
          investment_date?: string | null
          investment_type: string
          issuer?: string | null
          last_sync?: string | null
          maturity_date?: string | null
          mt_account_number?: string | null
          mt_broker?: string | null
          mt_platform?: string | null
          mt_server?: string | null
          name: string
          ownership_percent?: number | null
          profit_loss?: number | null
          sector?: string | null
          shares?: number | null
          status?: string | null
          symbol?: string | null
          sync_status?: string | null
          this_year_contribution?: number | null
          units?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          avg_cost?: number | null
          avg_price?: number | null
          balance?: number | null
          bond_type?: string | null
          broker?: string | null
          business_name?: string | null
          company_name?: string | null
          coupon_rate?: number | null
          created_at?: string
          currency?: string | null
          current_nav?: number | null
          current_price?: number | null
          current_value?: number | null
          description?: string | null
          equity?: number | null
          exchange?: string | null
          face_value?: number | null
          fund_category?: string | null
          fund_code?: string | null
          fund_house?: string | null
          id?: string
          initial_investment?: number | null
          investment_date?: string | null
          investment_type?: string
          issuer?: string | null
          last_sync?: string | null
          maturity_date?: string | null
          mt_account_number?: string | null
          mt_broker?: string | null
          mt_platform?: string | null
          mt_server?: string | null
          name?: string
          ownership_percent?: number | null
          profit_loss?: number | null
          sector?: string | null
          shares?: number | null
          status?: string | null
          symbol?: string | null
          sync_status?: string | null
          this_year_contribution?: number | null
          units?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      growth_referral_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          invited_email: string
          referral_code: string
          rewarded_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_email: string
          referral_code: string
          rewarded_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_email?: string
          referral_code?: string
          rewarded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invitee_email: string
          inviter_user_id: string
          permissions: Json
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitee_email: string
          inviter_user_id: string
          permissions?: Json
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitee_email?: string
          inviter_user_id?: string
          permissions?: Json
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lifecycle_email_preferences: {
        Row: {
          bill_reminders: boolean
          created_at: string
          milestones: boolean
          monthly_close: boolean
          onboarding: boolean
          tax_season: boolean
          updated_at: string
          user_id: string
          weekly_review: boolean
        }
        Insert: {
          bill_reminders?: boolean
          created_at?: string
          milestones?: boolean
          monthly_close?: boolean
          onboarding?: boolean
          tax_season?: boolean
          updated_at?: string
          user_id: string
          weekly_review?: boolean
        }
        Update: {
          bill_reminders?: boolean
          created_at?: string
          milestones?: boolean
          monthly_close?: boolean
          onboarding?: boolean
          tax_season?: boolean
          updated_at?: string
          user_id?: string
          weekly_review?: boolean
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          created_at: string
          currency: string | null
          current_balance: number
          description: string | null
          id: string
          interest_rate: number | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          interest_rate?: number | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          interest_rate?: number | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string
          currency: string
          current_balance: number
          description: string | null
          id: string
          interest_rate: number
          lender: string
          loan_purpose: string | null
          loan_term_years: number
          loan_type: string
          monthly_payment: number
          original_amount: number
          payment_due_date: number | null
          property_address: string | null
          property_loan_type: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
          vehicle_details: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          current_balance: number
          description?: string | null
          id?: string
          interest_rate: number
          lender: string
          loan_purpose?: string | null
          loan_term_years: number
          loan_type: string
          monthly_payment: number
          original_amount: number
          payment_due_date?: number | null
          property_address?: string | null
          property_loan_type?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vehicle_details?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          current_balance?: number
          description?: string | null
          id?: string
          interest_rate?: number
          lender?: string
          loan_purpose?: string | null
          loan_term_years?: number
          loan_type?: string
          monthly_payment?: number
          original_amount?: number
          payment_due_date?: number | null
          property_address?: string | null
          property_loan_type?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_details?: string | null
        }
        Relationships: []
      }
      money_challenge_progress: {
        Row: {
          challenge_key: string
          challenge_name: string
          completed_at: string | null
          created_at: string
          id: string
          joined_at: string
          progress: number
          status: string
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_key: string
          challenge_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          progress?: number
          status?: string
          target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_key?: string
          challenge_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          progress?: number
          status?: string
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_updates: {
        Row: {
          bills_paid_confirmed: boolean | null
          budget_set: boolean | null
          cash_updated: boolean | null
          completed_at: string | null
          created_at: string
          expenses_reviewed: boolean | null
          id: string
          insurance_reviewed: boolean | null
          investments_updated: boolean | null
          month: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bills_paid_confirmed?: boolean | null
          budget_set?: boolean | null
          cash_updated?: boolean | null
          completed_at?: string | null
          created_at?: string
          expenses_reviewed?: boolean | null
          id?: string
          insurance_reviewed?: boolean | null
          investments_updated?: boolean | null
          month: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bills_paid_confirmed?: boolean | null
          budget_set?: boolean | null
          cash_updated?: boolean | null
          completed_at?: string | null
          created_at?: string
          expenses_reviewed?: boolean | null
          id?: string
          insurance_reviewed?: boolean | null
          investments_updated?: boolean | null
          month?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt_account_history: {
        Row: {
          account_timestamp: string
          balance: number
          created_at: string
          equity: number
          floating_pl: number | null
          free_margin: number | null
          id: string
          investment_id: string
          margin: number | null
          margin_level: number | null
          open_lots: number | null
          realized_pl_today: number | null
          total_positions: number | null
          user_id: string
        }
        Insert: {
          account_timestamp: string
          balance: number
          created_at?: string
          equity: number
          floating_pl?: number | null
          free_margin?: number | null
          id?: string
          investment_id: string
          margin?: number | null
          margin_level?: number | null
          open_lots?: number | null
          realized_pl_today?: number | null
          total_positions?: number | null
          user_id: string
        }
        Update: {
          account_timestamp?: string
          balance?: number
          created_at?: string
          equity?: number
          floating_pl?: number | null
          free_margin?: number | null
          id?: string
          investment_id?: string
          margin?: number | null
          margin_level?: number | null
          open_lots?: number | null
          realized_pl_today?: number | null
          total_positions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_account_history_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_positions: {
        Row: {
          commission: number | null
          current_price: number | null
          id: string
          investment_id: string
          last_updated: string
          lots: number
          open_price: number
          open_time: string
          position_type: string
          profit_loss: number | null
          stop_loss: number | null
          swap: number | null
          symbol: string
          take_profit: number | null
          ticket_number: number
          user_id: string
        }
        Insert: {
          commission?: number | null
          current_price?: number | null
          id?: string
          investment_id: string
          last_updated?: string
          lots: number
          open_price: number
          open_time: string
          position_type: string
          profit_loss?: number | null
          stop_loss?: number | null
          swap?: number | null
          symbol: string
          take_profit?: number | null
          ticket_number: number
          user_id: string
        }
        Update: {
          commission?: number | null
          current_price?: number | null
          id?: string
          investment_id?: string
          last_updated?: string
          lots?: number
          open_price?: number
          open_time?: string
          position_type?: string
          profit_loss?: number | null
          stop_loss?: number | null
          swap?: number | null
          symbol?: string
          take_profit?: number | null
          ticket_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_positions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_goals: {
        Row: {
          achieved_date: string | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          display_order: number | null
          goal_name: string
          goal_type: string | null
          id: string
          is_achieved: boolean | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_date?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          display_order?: number | null
          goal_name: string
          goal_type?: string | null
          id?: string
          is_achieved?: boolean | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_date?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          display_order?: number | null
          goal_name?: string
          goal_type?: string | null
          id?: string
          is_achieved?: boolean | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      net_worth_history: {
        Row: {
          created_at: string
          currency: string | null
          date: string
          id: string
          net_worth: number
          total_assets: number | null
          total_liabilities: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          date: string
          id?: string
          net_worth: number
          total_assets?: number | null
          total_liabilities?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          date?: string
          id?: string
          net_worth?: number
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      other_assets: {
        Row: {
          asset_name: string
          category: string
          created_at: string
          currency: string | null
          current_value: number
          description: string | null
          id: string
          purchase_date: string | null
          purchase_price: number
          quantity: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          category: string
          created_at?: string
          currency?: string | null
          current_value: number
          description?: string | null
          id?: string
          purchase_date?: string | null
          purchase_price: number
          quantity?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          category?: string
          created_at?: string
          currency?: string | null
          current_value?: number
          description?: string | null
          id?: string
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_status: {
        Row: {
          account_number: number
          balance: number | null
          created_at: string | null
          equity: number | null
          id: string
          last_updated: string | null
          profit: number | null
          server_time: string | null
          user_id: string | null
        }
        Insert: {
          account_number: number
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          id?: string
          last_updated?: string | null
          profit?: number | null
          server_time?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: number
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          id?: string
          last_updated?: string | null
          profit?: number | null
          server_time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      premium_selections: {
        Row: {
          created_at: string
          selected_at: string
          selected_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          selected_at?: string
          selected_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          selected_at?: string
          selected_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string | null
          emergency_fund_current_amount: number | null
          emergency_fund_target: number | null
          emergency_fund_target_months: number | null
          emergency_fund_updated_at: string | null
          full_name: string | null
          id: string
          monthly_investment_target: number | null
          monthly_savings_target: number | null
          preferences: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string | null
          emergency_fund_current_amount?: number | null
          emergency_fund_target?: number | null
          emergency_fund_target_months?: number | null
          emergency_fund_updated_at?: string | null
          full_name?: string | null
          id: string
          monthly_investment_target?: number | null
          monthly_savings_target?: number | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string | null
          emergency_fund_current_amount?: number | null
          emergency_fund_target?: number | null
          emergency_fund_target_months?: number | null
          emergency_fund_updated_at?: string | null
          full_name?: string | null
          id?: string
          monthly_investment_target?: number | null
          monthly_savings_target?: number | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      real_estate: {
        Row: {
          address: string
          created_at: string
          currency: string | null
          current_value: number
          description: string | null
          id: string
          property_type: string
          purchase_date: string | null
          purchase_price: number
          rental_income: number | null
          rental_status: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          currency?: string | null
          current_value: number
          description?: string | null
          id?: string
          property_type: string
          purchase_date?: string | null
          purchase_price: number
          rental_income?: number | null
          rental_status?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          currency?: string | null
          current_value?: number
          description?: string | null
          id?: string
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number
          rental_income?: number | null
          rental_status?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          current_amount: number
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_planning: {
        Row: {
          annual_income: number | null
          created_at: string | null
          deductions: Json | null
          donation_amount: number | null
          estimated_tax: number | null
          id: string
          tax_year: number
          taxable_income: number | null
          total_deductions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_income?: number | null
          created_at?: string | null
          deductions?: Json | null
          donation_amount?: number | null
          estimated_tax?: number | null
          id?: string
          tax_year: number
          taxable_income?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_income?: number | null
          created_at?: string | null
          deductions?: Json | null
          donation_amount?: number | null
          estimated_tax?: number | null
          id?: string
          tax_year?: number
          taxable_income?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trust_center_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json
          requested_at: string
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          requested_at?: string
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          requested_at?: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          account_name: string | null
          amount: number
          category: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          merchant: string | null
          payment_method: string | null
          source: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          amount: number
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          merchant?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          merchant?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          currency: string | null
          current_value: number
          description: string | null
          id: string
          license_plate: string | null
          make: string
          model: string
          purchase_date: string | null
          purchase_price: number
          status: string | null
          updated_at: string
          user_id: string
          vehicle_type: string
          vin: string | null
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_value: number
          description?: string | null
          id?: string
          license_plate?: string | null
          make: string
          model: string
          purchase_date?: string | null
          purchase_price: number
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_type: string
          vin?: string | null
          year: number
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_value?: number
          description?: string | null
          id?: string
          license_plate?: string | null
          make?: string
          model?: string
          purchase_date?: string | null
          purchase_price?: number
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          focus_title: string | null
          id: string
          status: string
          summary: Json
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          focus_title?: string | null
          id?: string
          status?: string
          summary?: Json
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          focus_title?: string | null
          id?: string
          status?: string
          summary?: Json
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_unused_api_keys: { Args: never; Returns: number }
      create_bill_reminder_notifications: { Args: never; Returns: undefined }
      create_budget_alert_notifications: { Args: never; Returns: undefined }
      create_default_categories_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_goal_progress_notifications: { Args: never; Returns: undefined }
      create_insurance_renewal_notifications: {
        Args: never
        Returns: undefined
      }
      generate_api_key: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

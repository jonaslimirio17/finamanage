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
      accounts: {
        Row: {
          account_type: string
          balance: number
          connected_at: string
          id: string
          last_sync: string | null
          mask: string | null
          profile_id: string
          provider: string
          provider_account_id: string
          refresh_token_hash: string | null
        }
        Insert: {
          account_type: string
          balance?: number
          connected_at?: string
          id?: string
          last_sync?: string | null
          mask?: string | null
          profile_id: string
          provider: string
          provider_account_id: string
          refresh_token_hash?: string | null
        }
        Update: {
          account_type?: string
          balance?: number
          connected_at?: string
          id?: string
          last_sync?: string | null
          mask?: string | null
          profile_id?: string
          provider?: string
          provider_account_id?: string
          refresh_token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: string
          created_at: string
          details: Json | null
          expires_at: string | null
          granted_at: string
          id: string
          profile_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          details?: Json | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          details?: Json | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_profiles: {
        Row: {
          bureau: string
          created_at: string
          id: string
          last_check: string | null
          profile_id: string
          raw_report: Json | null
          score: number | null
        }
        Insert: {
          bureau: string
          created_at?: string
          id?: string
          last_check?: string | null
          profile_id: string
          raw_report?: Json | null
          score?: number | null
        }
        Update: {
          bureau?: string
          created_at?: string
          id?: string
          last_check?: string | null
          profile_id?: string
          raw_report?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          creditor: string
          due_date: string | null
          id: string
          interest_rate: number | null
          principal: number
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          creditor: string
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          principal: number
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          creditor?: string
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          principal?: number
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          profile_id: string
          recurrence: string | null
          status: string
          target_amount: number
          target_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          profile_id: string
          recurrence?: string | null
          status?: string
          target_amount: number
          target_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          profile_id?: string
          recurrence?: string | null
          status?: string
          target_amount?: number
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          cta: string | null
          id: string
          is_read: boolean
          profile_id: string
          summary: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          cta?: string | null
          id?: string
          is_read?: boolean
          profile_id: string
          summary: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          cta?: string | null
          id?: string
          is_read?: boolean
          profile_id?: string
          summary?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      pre_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source_page: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source_page?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source_page?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf_hash: string | null
          created_at: string
          email: string
          email_notifications: boolean | null
          estimated_income: number | null
          id: string
          last_login: string | null
          nome: string
        }
        Insert: {
          cpf_hash?: string | null
          created_at?: string
          email: string
          email_notifications?: boolean | null
          estimated_income?: number | null
          id: string
          last_login?: string | null
          nome: string
        }
        Update: {
          cpf_hash?: string | null
          created_at?: string
          email?: string
          email_notifications?: boolean | null
          estimated_income?: number | null
          id?: string
          last_login?: string | null
          nome?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          currency: string
          date: string
          id: string
          imported_from: string
          merchant: string | null
          profile_id: string
          provider_transaction_id: string | null
          raw_description: string | null
          subcategory: string | null
          tags: string[] | null
          type: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          date: string
          id?: string
          imported_from: string
          merchant?: string | null
          profile_id: string
          provider_transaction_id?: string | null
          raw_description?: string | null
          subcategory?: string | null
          tags?: string[] | null
          type: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          date?: string
          id?: string
          imported_from?: string
          merchant?: string | null
          profile_id?: string
          provider_transaction_id?: string | null
          raw_description?: string | null
          subcategory?: string | null
          tags?: string[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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

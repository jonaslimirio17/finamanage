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
      account_deletion_logs: {
        Row: {
          deleted_at: string
          email: string
          id: string
          profile_id: string
          reason: string | null
        }
        Insert: {
          deleted_at?: string
          email: string
          id?: string
          profile_id: string
          reason?: string | null
        }
        Update: {
          deleted_at?: string
          email?: string
          id?: string
          profile_id?: string
          reason?: string | null
        }
        Relationships: []
      }
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
      asaas_payments: {
        Row: {
          asaas_payment_id: string
          bank_slip_url: string | null
          created_at: string | null
          due_date: string
          id: string
          invoice_url: string | null
          payment_date: string | null
          payment_method: string
          pix_copy_paste: string | null
          pix_qrcode: string | null
          profile_id: string
          status: string
          subscription_id: string | null
          value: number
        }
        Insert: {
          asaas_payment_id: string
          bank_slip_url?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method: string
          pix_copy_paste?: string | null
          pix_qrcode?: string | null
          profile_id: string
          status: string
          subscription_id?: string | null
          value: number
        }
        Update: {
          asaas_payment_id?: string
          bank_slip_url?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string
          pix_copy_paste?: string | null
          pix_qrcode?: string | null
          profile_id?: string
          status?: string
          subscription_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "asaas_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_subscriptions: {
        Row: {
          asaas_customer_id: string
          asaas_subscription_id: string
          created_at: string | null
          id: string
          next_due_date: string | null
          payment_method: string
          profile_id: string
          status: string
          updated_at: string | null
          value: number
        }
        Insert: {
          asaas_customer_id: string
          asaas_subscription_id: string
          created_at?: string | null
          id?: string
          next_due_date?: string | null
          payment_method: string
          profile_id: string
          status: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          asaas_customer_id?: string
          asaas_subscription_id?: string
          created_at?: string | null
          id?: string
          next_due_date?: string | null
          payment_method?: string
          profile_id?: string
          status?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_subscriptions_profile_id_fkey"
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
          recurrence: string | null
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
          recurrence?: string | null
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
          recurrence?: string | null
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
      educational_content: {
        Row: {
          author: string | null
          content_body: string | null
          content_type: string
          created_at: string
          description: string
          duration_minutes: number | null
          file_url: string | null
          id: string
          is_published: boolean
          order_position: number
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          content_body?: string | null
          content_type: string
          created_at?: string
          description: string
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_position?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          content_body?: string | null
          content_type?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          order_position?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
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
      fair_leads: {
        Row: {
          coupon_code: string
          created_at: string | null
          discount_type: string | null
          email: string
          id: string
          name: string
          phone: string | null
          prize_won: string
          redeemed_at: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          coupon_code: string
          created_at?: string | null
          discount_type?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          prize_won: string
          redeemed_at?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          coupon_code?: string
          created_at?: string | null
          discount_type?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          prize_won?: string
          redeemed_at?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          order_position: number
          question: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          order_position?: number
          question: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          order_position?: number
          question?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
      password_resets: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          profile_id: string | null
          request_ip: string | null
          request_user_agent: string | null
          token_hash: string
          used: boolean
          used_at: string | null
          used_ip: string | null
          used_user_agent: string | null
          verification_attempts: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          profile_id?: string | null
          request_ip?: string | null
          request_user_agent?: string | null
          token_hash: string
          used?: boolean
          used_at?: string | null
          used_ip?: string | null
          used_user_agent?: string | null
          verification_attempts?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string | null
          request_ip?: string | null
          request_user_agent?: string | null
          token_hash?: string
          used?: boolean
          used_at?: string | null
          used_ip?: string | null
          used_user_agent?: string | null
          verification_attempts?: number
        }
        Relationships: [
          {
            foreignKeyName: "password_resets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          phone: string | null
          subscription_expires_at: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_started_at: string | null
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
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_started_at?: string | null
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
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_started_at?: string | null
        }
        Relationships: []
      }
      receipt_uploads: {
        Row: {
          created_at: string
          extracted_data: Json | null
          file_path: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          file_path: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          file_path?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: []
      }
      support_agents: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
      support_articles: {
        Row: {
          body: string
          created_at: string
          id: string
          summary: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          summary: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          email: string
          id: string
          name: string
          priority: string
          profile_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          priority?: string
          profile_id?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          priority?: string
          profile_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          attachments: Json | null
          comment: string
          created_at: string
          id: string
          profile_id: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          comment: string
          created_at?: string
          id?: string
          profile_id?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          comment?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          priority: number
          profile_id: string
          subcategory: string | null
          tags: string[] | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          priority?: number
          profile_id: string
          subcategory?: string | null
          tags?: string[] | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          priority?: number
          profile_id?: string
          subcategory?: string | null
          tags?: string[] | null
          transaction_type?: string
          updated_at?: string
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
      whatsapp_sessions: {
        Row: {
          context: Json | null
          id: string
          last_message_at: string
          phone_number: string
          profile_id: string
          state: string
        }
        Insert: {
          context?: Json | null
          id?: string
          last_message_at?: string
          phone_number: string
          profile_id: string
          state?: string
        }
        Update: {
          context?: Json | null
          id?: string
          last_message_at?: string
          phone_number?: string
          profile_id?: string
          state?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_password_resets: { Args: never; Returns: undefined }
      is_premium_user: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      subscription_plan: "free" | "premium"
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
    Enums: {
      subscription_plan: ["free", "premium"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          commerce_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          is_read: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          commerce_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean | null
          message: string
          title: string
          type: string
        }
        Update: {
          commerce_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_config: {
        Row: {
          account_holder: string
          bank_name: string | null
          cnpj: string | null
          created_at: string
          id: string
          pix_key: string
          pix_key_type: string
          qr_code_url: string | null
          updated_at: string
        }
        Insert: {
          account_holder: string
          bank_name?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          pix_key: string
          pix_key_type?: string
          qr_code_url?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string
          bank_name?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          pix_key?: string
          pix_key_type?: string
          qr_code_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          commerce_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          order_id: string | null
          payment_method: string
          type: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          commerce_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method: string
          type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          commerce_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          commerce_id: string
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          commerce_id: string
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          commerce_id?: string
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          commerce_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          commerce_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          commerce_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_coupons: {
        Row: {
          code: string
          commerce_id: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          first_order_only: boolean | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          max_uses: number | null
          min_order_value: number | null
          updated_at: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          commerce_id: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          commerce_id?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_coupons_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_coupons_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_notifications: {
        Row: {
          commerce_id: string
          created_at: string
          id: string
          invoice_id: string | null
          is_read: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          commerce_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean | null
          message: string
          title: string
          type: string
        }
        Update: {
          commerce_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_notifications_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_notifications_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_photos: {
        Row: {
          caption: string | null
          commerce_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          commerce_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          commerce_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_photos_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_photos_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      commerces: {
        Row: {
          address: string | null
          address_number: string | null
          approved_at: string | null
          auto_invoice_day: number | null
          auto_invoice_enabled: boolean | null
          cep: string | null
          city: string | null
          complement: string | null
          coupon_code: string | null
          cover_url: string | null
          created_at: string
          delivery_enabled: boolean | null
          document: string
          document_type: string
          email: string
          employee_visible_menu_items: string[] | null
          facebook_url: string | null
          fantasy_name: string
          force_password_change: boolean | null
          id: string
          instagram_url: string | null
          is_open: boolean | null
          logo_url: string | null
          management_password: string | null
          neighborhood: string | null
          opening_hours: Json | null
          owner_id: string
          owner_name: string
          payment_due_day: number | null
          phone: string
          plan_id: string | null
          rejection_reason: string | null
          requested_plan_id: string | null
          status: Database["public"]["Enums"]["commerce_status"]
          table_payment_required: boolean
          tax_paid_at: string | null
          tax_paid_current_month: boolean | null
          tax_payment_day: number | null
          tax_regime: string | null
          tax_type: string | null
          tax_value: number | null
          temp_password_set_at: string | null
          updated_at: string
          upgrade_request_date: string | null
          upgrade_request_status: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          approved_at?: string | null
          auto_invoice_day?: number | null
          auto_invoice_enabled?: boolean | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          coupon_code?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean | null
          document: string
          document_type: string
          email: string
          employee_visible_menu_items?: string[] | null
          facebook_url?: string | null
          fantasy_name: string
          force_password_change?: boolean | null
          id?: string
          instagram_url?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          management_password?: string | null
          neighborhood?: string | null
          opening_hours?: Json | null
          owner_id: string
          owner_name: string
          payment_due_day?: number | null
          phone: string
          plan_id?: string | null
          rejection_reason?: string | null
          requested_plan_id?: string | null
          status?: Database["public"]["Enums"]["commerce_status"]
          table_payment_required?: boolean
          tax_paid_at?: string | null
          tax_paid_current_month?: boolean | null
          tax_payment_day?: number | null
          tax_regime?: string | null
          tax_type?: string | null
          tax_value?: number | null
          temp_password_set_at?: string | null
          updated_at?: string
          upgrade_request_date?: string | null
          upgrade_request_status?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          approved_at?: string | null
          auto_invoice_day?: number | null
          auto_invoice_enabled?: boolean | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          coupon_code?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean | null
          document?: string
          document_type?: string
          email?: string
          employee_visible_menu_items?: string[] | null
          facebook_url?: string | null
          fantasy_name?: string
          force_password_change?: boolean | null
          id?: string
          instagram_url?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          management_password?: string | null
          neighborhood?: string | null
          opening_hours?: Json | null
          owner_id?: string
          owner_name?: string
          payment_due_day?: number | null
          phone?: string
          plan_id?: string | null
          rejection_reason?: string | null
          requested_plan_id?: string | null
          status?: Database["public"]["Enums"]["commerce_status"]
          table_payment_required?: boolean
          tax_paid_at?: string | null
          tax_paid_current_month?: boolean | null
          tax_payment_day?: number | null
          tax_regime?: string | null
          tax_type?: string | null
          tax_value?: number | null
          temp_password_set_at?: string | null
          updated_at?: string
          upgrade_request_date?: string | null
          upgrade_request_status?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerces_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerces_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          cep_end: string
          cep_start: string
          commerce_id: string
          created_at: string
          delivery_fee: number
          estimated_time: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          cep_end: string
          cep_start: string
          commerce_id: string
          created_at?: string
          delivery_fee?: number
          estimated_time?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          cep_end?: string
          cep_start?: string
          commerce_id?: string
          created_at?: string
          delivery_fee?: number
          estimated_time?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_zones_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          custom_message: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          plan_ids: string[] | null
          updated_at: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          custom_message?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_ids?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          custom_message?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_ids?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          commerce_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          is_paid: boolean | null
          name: string
          paid_at: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          commerce_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean
          is_paid?: boolean | null
          name: string
          paid_at?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commerce_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean
          is_paid?: boolean | null
          name?: string
          paid_at?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          commerce_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          commerce_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          commerce_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          commerce_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          category: string
          commerce_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id?: string | null
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          category?: string
          commerce_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          author_type: string
          commerce_id: string | null
          content: string
          created_at: string
          id: string
          is_solution: boolean | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name: string
          author_type?: string
          commerce_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          author_type?: string
          commerce_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topic_votes: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          author_type: string
          category: string
          commerce_id: string | null
          content: string
          created_at: string
          dislikes_count: number | null
          id: string
          is_closed: boolean | null
          is_pinned: boolean | null
          is_solved: boolean | null
          last_reply_at: string | null
          likes_count: number | null
          replies_count: number | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name: string
          author_type?: string
          category?: string
          commerce_id?: string | null
          content: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          is_solved?: boolean | null
          last_reply_at?: string | null
          likes_count?: number | null
          replies_count?: number | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          author_type?: string
          category?: string
          commerce_id?: string | null
          content?: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          is_solved?: boolean | null
          last_reply_at?: string | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topics_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          commerce_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by_commerce: boolean | null
          payment_method: string | null
          reference_month: string
          status: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          commerce_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_commerce?: boolean | null
          payment_method?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          commerce_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_commerce?: boolean | null
          payment_method?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commerce_id: string
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          discount: number | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_type: string | null
          payment_method: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_deducted: boolean
          subtotal: number
          table_id: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commerce_id: string
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          discount?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_deducted?: boolean
          subtotal: number
          table_id?: string | null
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commerce_id?: string
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          discount?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_deducted?: boolean
          subtotal?: number
          table_id?: string | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          commerce_id: string
          created_at: string
          fee_fixed: number | null
          fee_percentage: number | null
          id: string
          is_active: boolean | null
          name: string
          pix_key: string | null
          pix_key_type: string | null
          pix_qr_code_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          commerce_id: string
          created_at?: string
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_code_url?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          commerce_id?: string
          created_at?: string
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_code_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          allowed_menu_items: Json | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
        }
        Insert: {
          allowed_menu_items?: Json | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          type: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Update: {
          allowed_menu_items?: Json | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          commerce_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          promotional_price: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          commerce_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          promotional_price?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          commerce_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          promotional_price?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_number: string | null
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string
          document: string | null
          email: string
          full_name: string
          id: string
          neighborhood: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string | null
          email: string
          full_name: string
          id?: string
          neighborhood?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          address_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string | null
          email?: string
          full_name?: string
          id?: string
          neighborhood?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          commerce_id: string
          commerce_reply: string | null
          commerce_reply_at: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          commerce_id: string
          commerce_reply?: string | null
          commerce_reply_at?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          commerce_id?: string
          commerce_reply?: string | null
          commerce_reply_at?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      site_customizations: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          created_at: string
          description: string
          id: string
          module: string
          published_at: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          module: string
          published_at?: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module?: string
          published_at?: string
          type?: string
        }
        Relationships: []
      }
      table_participants: {
        Row: {
          bill_requested: boolean | null
          bill_requested_at: string | null
          change_for: number | null
          customer_name: string | null
          id: string
          is_host: boolean
          joined_at: string
          selected_payment_method: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          bill_requested?: boolean | null
          bill_requested_at?: string | null
          change_for?: number | null
          customer_name?: string | null
          id?: string
          is_host?: boolean
          joined_at?: string
          selected_payment_method?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          bill_requested?: boolean | null
          bill_requested_at?: string | null
          change_for?: number | null
          customer_name?: string | null
          id?: string
          is_host?: boolean
          joined_at?: string
          selected_payment_method?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          bill_mode: string
          closed_at: string | null
          commerce_id: string
          id: string
          opened_at: string
          opened_by_user_id: string | null
          status: string
          table_id: string
        }
        Insert: {
          bill_mode?: string
          closed_at?: string | null
          commerce_id: string
          id?: string
          opened_at?: string
          opened_by_user_id?: string | null
          status?: string
          table_id: string
        }
        Update: {
          bill_mode?: string
          closed_at?: string | null
          commerce_id?: string
          id?: string
          opened_at?: string
          opened_by_user_id?: string | null
          status?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number | null
          closed_at: string | null
          commerce_id: string
          created_at: string
          current_order_id: string | null
          id: string
          name: string | null
          number: number
          opened_at: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["table_status"] | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          closed_at?: string | null
          commerce_id: string
          created_at?: string
          current_order_id?: string | null
          id?: string
          name?: string | null
          number: number
          opened_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["table_status"] | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          closed_at?: string | null
          commerce_id?: string
          created_at?: string
          current_order_id?: string | null
          id?: string
          name?: string | null
          number?: number
          opened_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["table_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      commerces_public: {
        Row: {
          address: string | null
          address_number: string | null
          cep: string | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          delivery_enabled: boolean | null
          fantasy_name: string | null
          id: string | null
          is_open: boolean | null
          logo_url: string | null
          neighborhood: string | null
          opening_hours: Json | null
          phone: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["commerce_status"] | null
          table_payment_required: boolean | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          fantasy_name?: string | null
          id?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          neighborhood?: string | null
          opening_hours?: Json | null
          phone?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["commerce_status"] | null
          table_payment_required?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          fantasy_name?: string | null
          id?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          neighborhood?: string | null
          opening_hours?: Json | null
          phone?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["commerce_status"] | null
          table_payment_required?: boolean | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerces_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          comment: string | null
          commerce_id: string | null
          created_at: string | null
          id: string | null
          rating: number | null
        }
        Insert: {
          comment?: string | null
          commerce_id?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Update: {
          comment?: string | null
          commerce_id?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_commerce_id_fkey"
            columns: ["commerce_id"]
            isOneToOne: false
            referencedRelation: "commerces_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_stock_deduction_for_order: {
        Args: { _order_id: string }
        Returns: undefined
      }
      can_manage_order: { Args: { _order_id: string }; Returns: boolean }
      get_active_sessions_for_tables: {
        Args: { p_table_ids: string[] }
        Returns: {
          bill_mode: string
          session_id: string
          table_id: string
        }[]
      }
      get_commerce_email_by_document: {
        Args: { p_document: string }
        Returns: string
      }
      get_commerce_storefront: {
        Args: { p_commerce_id: string }
        Returns: {
          address: string
          address_number: string
          city: string
          cover_url: string
          delivery_enabled: boolean
          facebook_url: string
          fantasy_name: string
          id: string
          instagram_url: string
          is_open: boolean
          logo_url: string
          neighborhood: string
          opening_hours: Json
          phone: string
          status: string
          table_payment_required: boolean
          whatsapp: string
        }[]
      }
      get_public_commerces: {
        Args: { p_limit?: number }
        Returns: {
          cep: string
          city: string
          cover_url: string
          fantasy_name: string
          id: string
          is_open: boolean
          logo_url: string
          neighborhood: string
          opening_hours: Json
          phone: string
          whatsapp: string
        }[]
      }
      get_public_stats: { Args: never; Returns: Json }
      get_ranking_commerces: {
        Args: never
        Returns: {
          cep: string
          city: string
          fantasy_name: string
          id: string
          logo_url: string
          neighborhood: string
          plan_id: string
        }[]
      }
      get_session_commerce_id: {
        Args: { _session_id: string }
        Returns: string
      }
      get_session_info_for_join: {
        Args: { p_session_id: string }
        Returns: {
          bill_mode: string
          commerce_id: string
          host_name: string
          id: string
          opened_at: string
          opened_by_user_id: string
          participants_count: number
          status: string
          table_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_commerce_approved: {
        Args: { p_commerce_id: string }
        Returns: boolean
      }
      is_commerce_owner_or_admin: {
        Args: { _commerce_id: string }
        Returns: boolean
      }
      is_master_admin: { Args: never; Returns: boolean }
      is_session_commerce_owner: {
        Args: { _session_id: string }
        Returns: boolean
      }
      is_session_participant: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "commerce" | "master_admin"
      commerce_status: "pending" | "approved" | "rejected" | "suspended"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      invoice_type: "payable" | "receivable"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "delivering"
        | "delivered"
        | "cancelled"
      plan_type: "basic" | "startup" | "business"
      table_status: "available" | "occupied" | "reserved" | "closed"
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
      app_role: ["user", "commerce", "master_admin"],
      commerce_status: ["pending", "approved", "rejected", "suspended"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      invoice_type: ["payable", "receivable"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "delivering",
        "delivered",
        "cancelled",
      ],
      plan_type: ["basic", "startup", "business"],
      table_status: ["available", "occupied", "reserved", "closed"],
    },
  },
} as const

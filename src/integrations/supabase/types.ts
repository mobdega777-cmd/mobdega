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
        ]
      }
      commerces: {
        Row: {
          address: string | null
          address_number: string | null
          approved_at: string | null
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string
          document: string
          document_type: string
          email: string
          fantasy_name: string
          id: string
          logo_url: string | null
          neighborhood: string | null
          owner_id: string
          owner_name: string
          phone: string
          plan_id: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["commerce_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          approved_at?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document: string
          document_type: string
          email: string
          fantasy_name: string
          id?: string
          logo_url?: string | null
          neighborhood?: string | null
          owner_id: string
          owner_name: string
          phone: string
          plan_id?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["commerce_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_number?: string | null
          approved_at?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string
          document_type?: string
          email?: string
          fantasy_name?: string
          id?: string
          logo_url?: string | null
          neighborhood?: string | null
          owner_id?: string
          owner_name?: string
          phone?: string
          plan_id?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["commerce_status"]
          updated_at?: string
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
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commerce_id: string
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
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id?: string | null
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commerce_id?: string
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
          status?: Database["public"]["Enums"]["order_status"]
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
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
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
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_number: string | null
          avatar_url: string | null
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
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_commerce_owner_or_admin: {
        Args: { _commerce_id: string }
        Returns: boolean
      }
      is_master_admin: { Args: never; Returns: boolean }
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

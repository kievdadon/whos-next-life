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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      business_applications: {
        Row: {
          address: string | null
          approved_at: string | null
          business_name: string
          business_type: string
          closure_message: string | null
          contact_name: string
          created_at: string
          description: string | null
          email: string
          friday_close: string | null
          friday_open: string | null
          id: string
          is_24_7: boolean | null
          monday_close: string | null
          monday_open: string | null
          phone: string | null
          saturday_close: string | null
          saturday_open: string | null
          status: string | null
          sunday_close: string | null
          sunday_open: string | null
          temporary_closure: boolean | null
          thursday_close: string | null
          thursday_open: string | null
          timezone: string | null
          tuesday_close: string | null
          tuesday_open: string | null
          updated_at: string
          wednesday_close: string | null
          wednesday_open: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          business_name: string
          business_type: string
          closure_message?: string | null
          contact_name: string
          created_at?: string
          description?: string | null
          email: string
          friday_close?: string | null
          friday_open?: string | null
          id?: string
          is_24_7?: boolean | null
          monday_close?: string | null
          monday_open?: string | null
          phone?: string | null
          saturday_close?: string | null
          saturday_open?: string | null
          status?: string | null
          sunday_close?: string | null
          sunday_open?: string | null
          temporary_closure?: boolean | null
          thursday_close?: string | null
          thursday_open?: string | null
          timezone?: string | null
          tuesday_close?: string | null
          tuesday_open?: string | null
          updated_at?: string
          wednesday_close?: string | null
          wednesday_open?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          business_name?: string
          business_type?: string
          closure_message?: string | null
          contact_name?: string
          created_at?: string
          description?: string | null
          email?: string
          friday_close?: string | null
          friday_open?: string | null
          id?: string
          is_24_7?: boolean | null
          monday_close?: string | null
          monday_open?: string | null
          phone?: string | null
          saturday_close?: string | null
          saturday_open?: string | null
          status?: string | null
          sunday_close?: string | null
          sunday_open?: string | null
          temporary_closure?: boolean | null
          thursday_close?: string | null
          thursday_open?: string | null
          timezone?: string | null
          tuesday_close?: string | null
          tuesday_open?: string | null
          updated_at?: string
          wednesday_close?: string | null
          wednesday_open?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string | null
          seller_id: string
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id: string
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id?: string
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          assigned_at: string | null
          cart_items: Json | null
          company_commission: number
          created_at: string
          customer_address: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_photo_url: string | null
          delivery_address: string | null
          delivery_fee: number
          delivery_time: string | null
          distance_miles: number | null
          driver_earning: number
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          picked_up_photo_url: string | null
          pickup_time: string | null
          restaurant_address: string
          status: string | null
          store_name: string | null
          stripe_session_id: string | null
          subtotal: number | null
          tax: number | null
          tips: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          cart_items?: Json | null
          company_commission: number
          created_at?: string
          customer_address: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_photo_url?: string | null
          delivery_address?: string | null
          delivery_fee: number
          delivery_time?: string | null
          distance_miles?: number | null
          driver_earning: number
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string | null
          order_status?: string | null
          payment_status?: string | null
          picked_up_photo_url?: string | null
          pickup_time?: string | null
          restaurant_address: string
          status?: string | null
          store_name?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax?: number | null
          tips?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          cart_items?: Json | null
          company_commission?: number
          created_at?: string
          customer_address?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_photo_url?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_time?: string | null
          distance_miles?: number | null
          driver_earning?: number
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string | null
          order_status?: string | null
          payment_status?: string | null
          picked_up_photo_url?: string | null
          pickup_time?: string | null
          restaurant_address?: string
          status?: string | null
          store_name?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax?: number | null
          tips?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_applications: {
        Row: {
          address: string
          approved_at: string | null
          availability: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          drivers_license_url: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          experience: string | null
          full_name: string
          id: string
          insurance_policy: string | null
          insurance_provider: string | null
          license_number: string
          phone: string
          secondary_id_url: string | null
          state: string | null
          status: string | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          approved_at?: string | null
          availability?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          drivers_license_url?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience?: string | null
          full_name: string
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          license_number: string
          phone: string
          secondary_id_url?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type: string
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          approved_at?: string | null
          availability?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          drivers_license_url?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience?: string | null
          full_name?: string
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          license_number?: string
          phone?: string
          secondary_id_url?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      driver_shifts: {
        Row: {
          clock_in_time: string
          clock_out_time: string | null
          created_at: string
          driver_id: string
          id: string
          status: string | null
          total_deliveries: number | null
          total_earnings: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          clock_in_time?: string
          clock_out_time?: string | null
          created_at?: string
          driver_id: string
          id?: string
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          clock_in_time?: string
          clock_out_time?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          delivery_address: string | null
          id: string
          order_status: string | null
          payment_status: string | null
          product_id: string | null
          quantity: number
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_order: number
          image_url: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_order?: number
          image_url: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_order?: number
          image_url?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string | null
          category: string
          created_at: string
          delivery_available: boolean | null
          delivery_radius: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          product_status: string | null
          stock_quantity: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          category: string
          created_at?: string
          delivery_available?: boolean | null
          delivery_radius?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          product_status?: string | null
          stock_quantity?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          category?: string
          created_at?: string
          delivery_available?: boolean | null
          delivery_radius?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          product_status?: string | null
          stock_quantity?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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

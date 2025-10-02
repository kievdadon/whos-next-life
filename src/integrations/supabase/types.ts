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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_applications: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          address: string | null
          approved_at: string | null
          brand_partnership_date: string | null
          business_name: string
          business_size: string | null
          business_type: string
          closure_message: string | null
          contact_name: string
          created_at: string
          description: string | null
          email: string
          friday_close: string | null
          friday_open: string | null
          has_physical_location: boolean | null
          id: string
          is_24_7: boolean | null
          is_brand_partner: boolean | null
          location_verified: boolean | null
          monday_close: string | null
          monday_open: string | null
          payout_enabled: boolean | null
          phone: string | null
          routing_number: string | null
          saturday_close: string | null
          saturday_open: string | null
          status: string | null
          store_accent_color: string | null
          store_primary_color: string | null
          store_secondary_color: string | null
          stripe_connect_account_id: string | null
          sunday_close: string | null
          sunday_open: string | null
          temporary_closure: boolean | null
          thursday_close: string | null
          thursday_open: string | null
          timezone: string | null
          tuesday_close: string | null
          tuesday_open: string | null
          updated_at: string
          website_config: Json | null
          wednesday_close: string | null
          wednesday_open: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          address?: string | null
          approved_at?: string | null
          brand_partnership_date?: string | null
          business_name: string
          business_size?: string | null
          business_type: string
          closure_message?: string | null
          contact_name: string
          created_at?: string
          description?: string | null
          email: string
          friday_close?: string | null
          friday_open?: string | null
          has_physical_location?: boolean | null
          id?: string
          is_24_7?: boolean | null
          is_brand_partner?: boolean | null
          location_verified?: boolean | null
          monday_close?: string | null
          monday_open?: string | null
          payout_enabled?: boolean | null
          phone?: string | null
          routing_number?: string | null
          saturday_close?: string | null
          saturday_open?: string | null
          status?: string | null
          store_accent_color?: string | null
          store_primary_color?: string | null
          store_secondary_color?: string | null
          stripe_connect_account_id?: string | null
          sunday_close?: string | null
          sunday_open?: string | null
          temporary_closure?: boolean | null
          thursday_close?: string | null
          thursday_open?: string | null
          timezone?: string | null
          tuesday_close?: string | null
          tuesday_open?: string | null
          updated_at?: string
          website_config?: Json | null
          wednesday_close?: string | null
          wednesday_open?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          address?: string | null
          approved_at?: string | null
          brand_partnership_date?: string | null
          business_name?: string
          business_size?: string | null
          business_type?: string
          closure_message?: string | null
          contact_name?: string
          created_at?: string
          description?: string | null
          email?: string
          friday_close?: string | null
          friday_open?: string | null
          has_physical_location?: boolean | null
          id?: string
          is_24_7?: boolean | null
          is_brand_partner?: boolean | null
          location_verified?: boolean | null
          monday_close?: string | null
          monday_open?: string | null
          payout_enabled?: boolean | null
          phone?: string | null
          routing_number?: string | null
          saturday_close?: string | null
          saturday_open?: string | null
          status?: string | null
          store_accent_color?: string | null
          store_primary_color?: string | null
          store_secondary_color?: string | null
          stripe_connect_account_id?: string | null
          sunday_close?: string | null
          sunday_open?: string | null
          temporary_closure?: boolean | null
          thursday_close?: string | null
          thursday_open?: string | null
          timezone?: string | null
          tuesday_close?: string | null
          tuesday_open?: string | null
          updated_at?: string
          website_config?: Json | null
          wednesday_close?: string | null
          wednesday_open?: string | null
        }
        Relationships: []
      }
      community_violations: {
        Row: {
          action_taken: string
          content_type: string
          created_at: string
          flagged_content: string
          id: string
          is_active: boolean
          moderator_notes: string | null
          resolved_at: string | null
          severity: string
          user_email: string
          violation_type: string
        }
        Insert: {
          action_taken: string
          content_type: string
          created_at?: string
          flagged_content: string
          id?: string
          is_active?: boolean
          moderator_notes?: string | null
          resolved_at?: string | null
          severity: string
          user_email: string
          violation_type: string
        }
        Update: {
          action_taken?: string
          content_type?: string
          created_at?: string
          flagged_content?: string
          id?: string
          is_active?: boolean
          moderator_notes?: string | null
          resolved_at?: string | null
          severity?: string
          user_email?: string
          violation_type?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          gig_id: string | null
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
          gig_id?: string | null
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
          gig_id?: string | null
          id?: string
          product_id?: string | null
          seller_id?: string
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
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
          commission_amount: number | null
          commission_rate: number | null
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
          payout_amount: number | null
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
          commission_amount?: number | null
          commission_rate?: number | null
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
          payout_amount?: number | null
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
          commission_amount?: number | null
          commission_rate?: number | null
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
          payout_amount?: number | null
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
          account_holder_name: string | null
          account_number: string | null
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
          payout_enabled: boolean | null
          phone: string
          routing_number: string | null
          secondary_id_url: string | null
          state: string | null
          status: string | null
          stripe_connect_account_id: string | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
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
          payout_enabled?: boolean | null
          phone: string
          routing_number?: string | null
          secondary_id_url?: string | null
          state?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type: string
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
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
          payout_enabled?: boolean | null
          phone?: string
          routing_number?: string | null
          secondary_id_url?: string | null
          state?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
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
      family_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          edited: boolean | null
          group_id: string | null
          id: string
          message_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited?: boolean | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited?: boolean | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_group_members: {
        Row: {
          display_name: string | null
          group_id: string | null
          id: string
          is_admin: boolean | null
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          display_name?: string | null
          group_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          display_name?: string | null
          group_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gig_applications: {
        Row: {
          applicant_user_id: string
          cover_message: string | null
          created_at: string | null
          estimated_completion_time: string | null
          gig_id: string
          id: string
          proposed_rate: number | null
          status: string | null
          updated_at: string | null
          worker_profile_id: string | null
        }
        Insert: {
          applicant_user_id: string
          cover_message?: string | null
          created_at?: string | null
          estimated_completion_time?: string | null
          gig_id: string
          id?: string
          proposed_rate?: number | null
          status?: string | null
          updated_at?: string | null
          worker_profile_id?: string | null
        }
        Update: {
          applicant_user_id?: string
          cover_message?: string | null
          created_at?: string | null
          estimated_completion_time?: string | null
          gig_id?: string
          id?: string
          proposed_rate?: number | null
          status?: string | null
          updated_at?: string | null
          worker_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_applications_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          assigned_to_user_id: string | null
          budget_max: number | null
          budget_min: number
          budget_type: string
          category: string
          created_at: string | null
          description: string
          duration_estimate: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          posted_by_user_id: string
          requirements: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          budget_max?: number | null
          budget_min: number
          budget_type?: string
          category: string
          created_at?: string | null
          description: string
          duration_estimate?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          latitude?: number | null
          location: string
          longitude?: number | null
          posted_by_user_id: string
          requirements?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          budget_max?: number | null
          budget_min?: number
          budget_type?: string
          category?: string
          created_at?: string | null
          description?: string
          duration_estimate?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          posted_by_user_id?: string
          requirements?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
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
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          id: string
          order_status: string | null
          payment_status: string | null
          payout_amount: number | null
          product_id: string | null
          quantity: number
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          payout_amount?: number | null
          product_id?: string | null
          quantity?: number
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          payout_amount?: number | null
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
      user_bans: {
        Row: {
          ban_duration_days: number | null
          ban_reason: string
          ban_type: string
          banned_at: string
          banned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          user_email: string
          violation_id: string | null
        }
        Insert: {
          ban_duration_days?: number | null
          ban_reason: string
          ban_type: string
          banned_at?: string
          banned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          user_email: string
          violation_id?: string | null
        }
        Update: {
          ban_duration_days?: number | null
          ban_reason?: string
          ban_type?: string
          banned_at?: string
          banned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          user_email?: string
          violation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bans_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "community_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          id: string
          issued_by: string | null
          user_email: string
          violation_id: string | null
          warning_message: string
          warning_reason: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          user_email: string
          violation_id?: string | null
          warning_message: string
          warning_reason: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          user_email?: string
          violation_id?: string | null
          warning_message?: string
          warning_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "community_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          mood_label: string | null
          mood_score: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          mood_label?: string | null
          mood_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          mood_label?: string | null
          mood_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "wellness_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          session_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          is_verified: boolean | null
          phone: string | null
          portfolio_url: string | null
          profile_photo_url: string | null
          rating: number | null
          skills: string[] | null
          total_jobs_completed: number | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          portfolio_url?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          skills?: string[] | null
          total_jobs_completed?: number | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          portfolio_url?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          skills?: string[] | null
          total_jobs_completed?: number | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_warning_count: {
        Args: { _user_email: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { _ban_type?: string; _user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "business_owner" | "user"
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
      app_role: ["admin", "driver", "business_owner", "user"],
    },
  },
} as const

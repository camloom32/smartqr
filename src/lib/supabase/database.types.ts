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
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'starter' | 'growth'
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: 'free' | 'starter' | 'growth'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          tier?: 'free' | 'starter' | 'growth'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
      dynamic_codes: {
        Row: {
          id: string
          user_id: string
          short_code: string
          destination_url: string
          title: string | null
          is_active: boolean
          style_json: Json
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          short_code: string
          destination_url: string
          title?: string | null
          is_active?: boolean
          style_json?: Json
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          destination_url?: string
          title?: string | null
          is_active?: boolean
          style_json?: Json
          logo_url?: string | null
          updated_at?: string
        }
      }
      scan_events: {
        Row: {
          id: number
          code_id: string
          client_ip: string | null
          user_agent: string | null
          device_category: 'mobile_ios' | 'mobile_android' | 'desktop' | 'tablet' | 'other' | null
          country: string | null
          region: string | null
          city: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: number
          code_id: string
          client_ip?: string | null
          user_agent?: string | null
          device_category?: 'mobile_ios' | 'mobile_android' | 'desktop' | 'tablet' | 'other' | null
          country?: string | null
          region?: string | null
          city?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: never
      }
      scan_daily_summaries: {
        Row: {
          id: number
          code_id: string
          date: string
          total_scans: number
          unique_scans: number
          device_breakdown: Json
          location_breakdown: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code_id: string
          date: string
          total_scans?: number
          unique_scans?: number
          device_breakdown?: Json
          location_breakdown?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_scans?: number
          unique_scans?: number
          device_breakdown?: Json
          location_breakdown?: Json
          updated_at?: string
        }
      }
      tiers: {
        Row: {
          id: 'free' | 'starter' | 'growth'
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          max_active_codes: number
          has_analytics: boolean
          has_logo_upload: boolean
          has_bulk_creation: boolean
          has_custom_domain: boolean
          has_team_access: boolean
          max_seats: number
          created_at: string
        }
        Insert: never
        Update: never
      }
      custom_domains: {
        Row: {
          id: string
          user_id: string
          domain: string
          is_verified: boolean
          verification_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          is_verified?: boolean
          verification_token?: string | null
          created_at?: string
        }
        Update: {
          domain?: string
          is_verified?: boolean
          verification_token?: string | null
        }
      }
    }
  }
}

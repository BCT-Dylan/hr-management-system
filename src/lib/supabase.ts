import { createClient } from '@supabase/supabase-js'

// Supabase project configuration
const supabaseUrl = 'https://nazicfjzdhnvddgjgaxg.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseAnonKey) {
  console.error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
  console.error('Please check your .env file and restart the development server');
}

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase config:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0
  });
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey || '')

// Database types (auto-generated based on our schema)
export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          title: string
          department: string
          location: string
          job_type: string
          description: string
          attachments: string[] | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department: string
          location: string
          job_type?: string
          description: string
          attachments?: string[] | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string
          location?: string
          job_type?: string
          description?: string
          attachments?: string[] | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      applicants: {
        Row: {
          id: string
          job_posting_id: string
          name: string
          email: string
          resume_file_url: string | null
          ai_score: number | null
          ai_summary: string | null
          status: 'pending' | 'reviewed' | 'selected' | 'rejected'
          is_selected: boolean
          email_sent: boolean
          email_sent_at: string | null
          last_email_type: 'interview' | 'rejection' | null
          last_email_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_posting_id: string
          name: string
          email: string
          resume_file_url?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          status?: 'pending' | 'reviewed' | 'selected' | 'rejected'
          is_selected?: boolean
          email_sent?: boolean
          email_sent_at?: string | null
          last_email_type?: 'interview' | 'rejection' | null
          last_email_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_posting_id?: string
          name?: string
          email?: string
          resume_file_url?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          status?: 'pending' | 'reviewed' | 'selected' | 'rejected'
          is_selected?: boolean
          email_sent?: boolean
          email_sent_at?: string | null
          last_email_type?: 'interview' | 'rejection' | null
          last_email_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          name: string
          purpose: 'general' | 'interview' | 'offer' | 'rejection'
          subject: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          purpose?: 'general' | 'interview' | 'offer' | 'rejection'
          subject: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          purpose?: 'general' | 'interview' | 'offer' | 'rejection'
          subject?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
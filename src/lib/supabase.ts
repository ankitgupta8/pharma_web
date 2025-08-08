import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      drugs: {
        Row: {
          id: number
          name: string
          class: string
          system: string
          moa: string
          uses: string[]
          side_effects: string[]
          mnemonic: string | null
          contraindications: string[] | null
          dosage: string | null
          created_at: string
        }
        Insert: {
          id: number
          name: string
          class: string
          system: string
          moa: string
          uses: string[]
          side_effects: string[]
          mnemonic?: string | null
          contraindications?: string[] | null
          dosage?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          class?: string
          system?: string
          moa?: string
          uses?: string[]
          side_effects?: string[]
          mnemonic?: string | null
          contraindications?: string[] | null
          dosage?: string | null
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: number
          user_id: string
          drug_id: number
          seen: boolean
          correct_count: number
          incorrect_count: number
          last_seen: string
          difficulty: 'easy' | 'medium' | 'hard'
          next_review_date: string
          review_interval: number
          ease_factor: number
          needs_review: boolean
          streak_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          drug_id: number
          seen?: boolean
          correct_count?: number
          incorrect_count?: number
          last_seen?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          next_review_date?: string
          review_interval?: number
          ease_factor?: number
          needs_review?: boolean
          streak_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          seen?: boolean
          correct_count?: number
          incorrect_count?: number
          last_seen?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          next_review_date?: string
          review_interval?: number
          ease_factor?: number
          needs_review?: boolean
          streak_count?: number
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: number
          user_id: string
          drug_id: number
          bookmarked_at: string
        }
        Insert: {
          user_id: string
          drug_id: number
          bookmarked_at?: string
        }
        Update: {
          bookmarked_at?: string
        }
      }
      quiz_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          total_questions: number
          completed_at: string
          system: string | null
          drug_class: string | null
          time_taken: number | null
        }
        Insert: {
          id: string
          user_id: string
          score: number
          total_questions: number
          completed_at?: string
          system?: string | null
          drug_class?: string | null
          time_taken?: number | null
        }
        Update: {
          score?: number
          total_questions?: number
          completed_at?: string
          system?: string | null
          drug_class?: string | null
          time_taken?: number | null
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          total_cards: number
          correct_cards: number
          incorrect_cards: number
          systems: string[]
          study_mode: 'all' | 'bookmarked' | 'unseen' | 'review'
          time_spent: number
        }
        Insert: {
          id: string
          user_id: string
          start_time?: string
          end_time?: string | null
          total_cards: number
          correct_cards?: number
          incorrect_cards?: number
          systems: string[]
          study_mode: 'all' | 'bookmarked' | 'unseen' | 'review'
          time_spent?: number
        }
        Update: {
          end_time?: string | null
          correct_cards?: number
          incorrect_cards?: number
          time_spent?: number
        }
      }
      drug_notes: {
        Row: {
          id: number
          user_id: string
          drug_id: number
          note: string
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          drug_id: number
          note: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          note?: string
          tags?: string[] | null
          updated_at?: string
        }
      }
      daily_drugs: {
        Row: {
          date: string
          drug_id: number
        }
        Insert: {
          date: string
          drug_id: number
        }
        Update: {
          drug_id?: number
        }
      }
    }
  }
}
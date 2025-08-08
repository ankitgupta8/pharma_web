-- Fix database setup for Drug Deck application
-- Run this in your Supabase SQL Editor

-- First, let's ensure all tables exist with proper structure
-- Create drugs table if it doesn't exist
CREATE TABLE IF NOT EXISTS drugs (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  system TEXT NOT NULL,
  moa TEXT NOT NULL,
  uses TEXT[] NOT NULL,
  side_effects TEXT[] NOT NULL,
  mnemonic TEXT,
  contraindications TEXT[],
  dosage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_drugs table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_drugs (
  date DATE PRIMARY KEY,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE
);

-- Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_interval INTEGER DEFAULT 1,
  ease_factor DECIMAL DEFAULT 2.5,
  needs_review BOOLEAN DEFAULT FALSE,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, drug_id)
);

-- Create bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, drug_id)
);

-- Create quiz_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_scores (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  system TEXT,
  drug_class TEXT,
  time_taken INTEGER
);

-- Create study_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_cards INTEGER NOT NULL,
  correct_cards INTEGER DEFAULT 0,
  incorrect_cards INTEGER DEFAULT 0,
  systems TEXT[] NOT NULL,
  study_mode TEXT CHECK (study_mode IN ('all', 'bookmarked', 'unseen', 'review')) NOT NULL,
  time_spent INTEGER DEFAULT 0
);

-- Create drug_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS drug_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view drugs" ON drugs;
DROP POLICY IF EXISTS "Anyone can view daily drugs" ON daily_drugs;
DROP POLICY IF EXISTS "Anyone can insert daily drugs" ON daily_drugs;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can view their own quiz scores" ON quiz_scores;
DROP POLICY IF EXISTS "Users can insert their own quiz scores" ON quiz_scores;
DROP POLICY IF EXISTS "Users can view their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can view their own drug notes" ON drug_notes;
DROP POLICY IF EXISTS "Users can insert their own drug notes" ON drug_notes;
DROP POLICY IF EXISTS "Users can update their own drug notes" ON drug_notes;
DROP POLICY IF EXISTS "Users can delete their own drug notes" ON drug_notes;

-- Create RLS policies
-- Drugs table is public (read-only for authenticated users)
CREATE POLICY "Authenticated users can view drugs" ON drugs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Daily drugs is public (read-only for authenticated users, insert for authenticated users)
CREATE POLICY "Authenticated users can view daily drugs" ON daily_drugs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert daily drugs" ON daily_drugs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update daily drugs" ON daily_drugs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Quiz scores policies
CREATE POLICY "Users can view their own quiz scores" ON quiz_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz scores" ON quiz_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Users can view their own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Drug notes policies
CREATE POLICY "Users can view their own drug notes" ON drug_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drug notes" ON drug_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drug notes" ON drug_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drug notes" ON drug_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_drug_id ON user_progress(drug_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_needs_review ON user_progress(needs_review);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_drug_id ON bookmarks(drug_id);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user_id ON quiz_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_drug_notes_user_id ON drug_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_drug_notes_drug_id ON drug_notes(drug_id);
CREATE INDEX IF NOT EXISTS idx_drugs_system ON drugs(system);
CREATE INDEX IF NOT EXISTS idx_drugs_class ON drugs(class);
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_daily_drugs_date ON daily_drugs(date);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
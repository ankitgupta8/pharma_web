# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for the Drug Deck application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. The Drug Deck React application

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `drug-deck` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Set Up Database Tables

Once your project is ready, go to the SQL Editor in your Supabase dashboard and run the following SQL to create all necessary tables:

```sql
-- Create drugs table
CREATE TABLE drugs (
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

-- Create user_progress table
CREATE TABLE user_progress (
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

-- Create bookmarks table
CREATE TABLE bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, drug_id)
);

-- Create quiz_scores table
CREATE TABLE quiz_scores (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  system TEXT,
  drug_class TEXT,
  time_taken INTEGER
);

-- Create study_sessions table
CREATE TABLE study_sessions (
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

-- Create drug_notes table
CREATE TABLE drug_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_drugs table
CREATE TABLE daily_drugs (
  date DATE PRIMARY KEY,
  drug_id BIGINT REFERENCES drugs(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Drugs table is public (read-only)
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view drugs" ON drugs FOR SELECT USING (true);

-- Daily drugs is public (read-only)
ALTER TABLE daily_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view daily drugs" ON daily_drugs FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_drug_id ON user_progress(drug_id);
CREATE INDEX idx_user_progress_needs_review ON user_progress(needs_review);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review_date);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_drug_id ON bookmarks(drug_id);
CREATE INDEX idx_quiz_scores_user_id ON quiz_scores(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_drug_notes_user_id ON drug_notes(user_id);
CREATE INDEX idx_drug_notes_drug_id ON drug_notes(drug_id);
CREATE INDEX idx_drugs_system ON drugs(system);
CREATE INDEX idx_drugs_class ON drugs(class);
CREATE INDEX idx_drugs_name ON drugs(name);
```

## Step 3: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your authentication settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production URL when deploying
3. Enable the authentication providers you want to use (Email is enabled by default)
4. Optionally, enable anonymous sign-ins if you want to allow guest users

## Step 4: Get Your Project Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 6: Install Dependencies and Run

The Supabase client is already installed. Just run:

```bash
npm start
```

## Step 7: Initialize Drug Data

When you first run the application and sign in, the app will automatically initialize the drugs table with the sample data from `drugData.json`. This happens only once when the table is empty.

## Features Included

✅ **Authentication**: Email/password and anonymous sign-in
✅ **User Progress Tracking**: Spaced repetition algorithm
✅ **Bookmarks**: Save favorite drugs
✅ **Quiz System**: Track quiz scores and history
✅ **Study Sessions**: Track study time and performance
✅ **Notes**: Add personal notes to drugs
✅ **Daily Drug**: Random drug of the day
✅ **Statistics**: Comprehensive analytics dashboard
✅ **Row Level Security**: Data isolation between users

## Troubleshooting

### Common Issues

1. **"User not authenticated" errors**: Make sure you're signed in and the auth context is properly set up
2. **Database connection errors**: Check your environment variables and Supabase project status
3. **RLS policy errors**: Ensure all RLS policies are created correctly
4. **CORS errors**: Make sure your site URL is configured in Supabase authentication settings

### Development Tips

1. Use the Supabase dashboard to monitor your database and debug queries
2. Check the browser console for detailed error messages
3. Use the Network tab to inspect API calls to Supabase
4. The `drugService` object in AppContext provides easy access to all database operations

## Production Deployment

When deploying to production:

1. Update the Site URL in Supabase Authentication settings
2. Add your production domain to Redirect URLs
3. Update environment variables in your hosting platform
4. Consider enabling additional security features in Supabase

## Support

If you encounter issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the browser console for error messages
3. Check the Supabase dashboard for database logs
4. Ensure all SQL commands were executed successfully
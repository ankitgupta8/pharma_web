-- Quick fix for daily_drugs RLS policy issue
-- Run this in your Supabase SQL Editor

-- Drop existing policies for daily_drugs
DROP POLICY IF EXISTS "Anyone can view daily drugs" ON daily_drugs;
DROP POLICY IF EXISTS "Authenticated users can view daily drugs" ON daily_drugs;
DROP POLICY IF EXISTS "Authenticated users can insert daily drugs" ON daily_drugs;
DROP POLICY IF EXISTS "Authenticated users can update daily drugs" ON daily_drugs;

-- Create more permissive policies for daily_drugs
-- Allow authenticated users to read daily drugs
CREATE POLICY "Allow authenticated users to read daily drugs" ON daily_drugs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert daily drugs
CREATE POLICY "Allow authenticated users to insert daily drugs" ON daily_drugs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update daily drugs
CREATE POLICY "Allow authenticated users to update daily drugs" ON daily_drugs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Alternative: If the above doesn't work, temporarily disable RLS for daily_drugs
-- Uncomment the line below if you continue having issues
-- ALTER TABLE daily_drugs DISABLE ROW LEVEL SECURITY;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
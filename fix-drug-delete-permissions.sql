-- Fix drug deletion permissions for admin users
-- Run this in your Supabase SQL Editor

-- Add policies to allow authenticated users to modify drugs table
-- This is needed for admin functionality

-- Drop existing drug policies
DROP POLICY IF EXISTS "Authenticated users can view drugs" ON drugs;
DROP POLICY IF EXISTS "Authenticated users can insert drugs" ON drugs;
DROP POLICY IF EXISTS "Authenticated users can update drugs" ON drugs;
DROP POLICY IF EXISTS "Authenticated users can delete drugs" ON drugs;

-- Create comprehensive drug policies for authenticated users
-- Allow all operations for authenticated users (you can restrict this further if needed)

-- Allow viewing drugs
CREATE POLICY "Authenticated users can view drugs" ON drugs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserting drugs (for data import)
CREATE POLICY "Authenticated users can insert drugs" ON drugs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updating drugs (for admin modifications)
CREATE POLICY "Authenticated users can update drugs" ON drugs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow deleting drugs (for admin functionality)
CREATE POLICY "Authenticated users can delete drugs" ON drugs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to restrict delete/insert/update to specific users only,
-- you can create a more restrictive policy. For example:
-- 
-- CREATE POLICY "Admin users can delete drugs" ON drugs
--   FOR DELETE USING (
--     auth.role() = 'authenticated' AND 
--     auth.jwt() ->> 'email' IN ('admin@example.com', 'your-admin-email@example.com')
--   );

-- Ensure the drugs table has RLS enabled
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON drugs TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
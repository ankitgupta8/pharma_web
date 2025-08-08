-- Fix drug import permissions by adding RLS policies for INSERT and UPDATE operations
-- This allows authenticated users to import drug data

-- Add policy to allow authenticated users to insert drugs
CREATE POLICY "Authenticated users can insert drugs" ON drugs
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Add policy to allow authenticated users to update drugs
CREATE POLICY "Authenticated users can update drugs" ON drugs
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: If you want to allow anonymous users to import data as well, 
-- uncomment the following policies instead of the above ones:

-- CREATE POLICY "Anyone can insert drugs" ON drugs
--   FOR INSERT 
--   WITH CHECK (true);

-- CREATE POLICY "Anyone can update drugs" ON drugs
--   FOR UPDATE 
--   USING (true)
--   WITH CHECK (true);
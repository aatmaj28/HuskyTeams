-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Copy full_name to name if name is null
UPDATE public.profiles 
SET name = full_name 
WHERE name IS NULL AND full_name IS NOT NULL;

-- Copy onboarding_complete to onboarding_completed if onboarding_completed is null
UPDATE public.profiles 
SET onboarding_completed = onboarding_complete 
WHERE onboarding_completed IS NULL;


-- Final fix for team_members RLS policies using SECURITY DEFINER function
-- Drop existing policies and function
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;
DROP FUNCTION IF EXISTS public.can_insert_team_member(UUID, UUID);

-- Create a SECURITY DEFINER function that bypasses RLS to check team membership
-- This prevents infinite recursion
CREATE OR REPLACE FUNCTION public.can_insert_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
  is_leader BOOLEAN;
BEGIN
  -- Count existing members (bypasses RLS due to SECURITY DEFINER)
  SELECT COUNT(*) INTO member_count
  FROM public.team_members
  WHERE team_id = team_uuid;
  
  -- If no members, allow insertion (creating first member)
  IF member_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a leader of this team (bypasses RLS)
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid
    AND profile_id = user_uuid
    AND role = 'leader'
  ) INTO is_leader;
  
  RETURN is_leader;
END;
$$;

-- Create INSERT policy using the function
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT 
WITH CHECK (
  public.can_insert_team_member(team_id, auth.uid())
);

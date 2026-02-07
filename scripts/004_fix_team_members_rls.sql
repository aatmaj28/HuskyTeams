-- Fix team_members RLS policies to prevent infinite recursion
-- Drop existing policies
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_member" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_self_or_leader" ON public.team_members;

-- Recreate SELECT policy (allow members of the team to see all members)
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.profile_id = auth.uid()
  )
);

-- Recreate INSERT policy (allow anyone to create first member, or leaders to add members)
-- Use a function to avoid recursion
CREATE OR REPLACE FUNCTION public.can_insert_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_count INTEGER;
  is_leader BOOLEAN;
BEGIN
  -- Count existing members
  SELECT COUNT(*) INTO member_count
  FROM public.team_members
  WHERE team_id = team_uuid;
  
  -- If no members, allow insertion (creating first member)
  IF member_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a leader of this team
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid
    AND profile_id = user_uuid
    AND role = 'leader'
  ) INTO is_leader;
  
  RETURN is_leader;
END;
$$;

CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT 
WITH CHECK (
  public.can_insert_team_member(team_id, auth.uid())
);

-- Recreate DELETE policy
CREATE POLICY "team_members_delete_self_or_leader" ON public.team_members FOR DELETE USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.profile_id = auth.uid() 
    AND tm.role = 'leader'
  )
);

-- Remove leader concept and update team_members table
-- First update all existing 'leader' roles to 'member'
UPDATE public.team_members SET role = 'member' WHERE role = 'leader';

-- Then change role constraint to just 'member'
ALTER TABLE public.team_members 
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check CHECK (role IN ('member'));

-- Update RLS policies to remove leader checks
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;

-- New INSERT policy: Allow if team has no members OR user is already a member
CREATE POLICY "team_members_insert_member" ON public.team_members FOR INSERT 
WITH CHECK (
  public.can_insert_team_member(team_id, auth.uid())
);

-- Update the function to not check for leader role
CREATE OR REPLACE FUNCTION public.can_insert_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  member_count INTEGER;
  user_status TEXT;
BEGIN
  -- Check if user already has "in_team" status
  SELECT status INTO user_status
  FROM public.profiles
  WHERE id = user_uuid;
  
  -- If user already has in_team status, don't allow joining another team
  IF user_status = 'in_team' THEN
    RETURN FALSE;
  END IF;
  
  -- Count existing members (bypasses RLS due to SECURITY DEFINER)
  EXECUTE format('SELECT COUNT(*) FROM public.team_members WHERE team_id = $1')
    USING team_uuid
    INTO member_count;
  
  -- If no members, allow insertion (creating first member)
  IF member_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- If team has members, check if user is already a member (can't add twice)
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = $1 AND profile_id = $2)')
    USING team_uuid, user_uuid
    INTO member_count;
  
  -- If already a member, don't allow (shouldn't happen due to UNIQUE constraint, but check anyway)
  IF member_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Allow any member of the team to add new members
  RETURN TRUE;
END;
$$;

-- Update DELETE policy to remove leader checks
DROP POLICY IF EXISTS "team_members_delete_self_or_leader" ON public.team_members;

CREATE POLICY "team_members_delete_self" ON public.team_members FOR DELETE USING (
  profile_id = auth.uid()
);

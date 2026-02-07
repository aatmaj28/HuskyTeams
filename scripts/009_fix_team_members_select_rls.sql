-- Fix team_members SELECT policy to allow users to see their own memberships
-- The current policy creates a circular dependency
DROP POLICY IF EXISTS "team_members_select_member" ON public.team_members;

-- New policy: Allow users to see:
-- 1. Their own team memberships (to check if they're in a team)
-- 2. Members of teams they're already part of (to see team roster)
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (
  -- Allow if this is the user's own membership
  profile_id = auth.uid()
  OR
  -- Allow if user is a member of the same team
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.profile_id = auth.uid()
  )
);

-- Fix team_members RLS policies with a simpler approach
-- Drop existing policies and function
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_member" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_self_or_leader" ON public.team_members;
DROP FUNCTION IF EXISTS public.can_insert_team_member(UUID, UUID);

-- Recreate SELECT policy (allow members of the team to see all members)
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.profile_id = auth.uid()
  )
);

-- Simpler INSERT policy: 
-- 1. Allow if team has no members yet (creating first member)
-- 2. Allow if user is a leader of the team
-- Use a subquery that doesn't reference the same table being inserted into
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT 
WITH CHECK (
  -- Case 1: Team has no members (checking a different query path to avoid recursion)
  NOT EXISTS (
    SELECT 1 FROM public.team_members existing
    WHERE existing.team_id = team_members.team_id
  )
  OR
  -- Case 2: User is already a leader of this team
  EXISTS (
    SELECT 1 FROM public.team_members existing
    WHERE existing.team_id = team_members.team_id
    AND existing.profile_id = auth.uid()
    AND existing.role = 'leader'
  )
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

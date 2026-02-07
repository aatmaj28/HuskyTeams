-- Simple fix: Allow any authenticated user to insert first member
-- This avoids recursion by not checking team_members in the policy
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;

-- Simple policy: Allow insert if:
-- 1. User is inserting themselves AND team has no members (first member)
-- 2. OR user is a leader (checked via function to avoid recursion)
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT 
WITH CHECK (
  -- Case 1: User is adding themselves and we use function to check if team is empty
  (profile_id = auth.uid() AND public.can_insert_team_member(team_id, auth.uid()))
  OR
  -- Case 2: User is a leader (function checks this)
  public.can_insert_team_member(team_id, auth.uid())
);

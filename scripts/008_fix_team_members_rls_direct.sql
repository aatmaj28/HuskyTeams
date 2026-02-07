-- Direct fix: Use a simpler policy that doesn't cause recursion
-- The key is to check team membership count without triggering RLS recursion
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.can_insert_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_insert_team_member(UUID, UUID) TO anon;

-- Update the function to use a more direct approach
CREATE OR REPLACE FUNCTION public.can_insert_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Use a direct query that bypasses RLS
  -- Count members using a subquery that doesn't trigger policy checks
  EXECUTE format('SELECT COUNT(*) FROM public.team_members WHERE team_id = $1')
    USING team_uuid
    INTO member_count;
  
  -- If no members, allow insertion (creating first member)
  IF member_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a leader
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = $1 AND profile_id = $2 AND role = ''leader'')')
    USING team_uuid, user_uuid
    INTO member_count;
  
  RETURN member_count > 0;
END;
$$;

-- Recreate the policy
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT 
WITH CHECK (
  public.can_insert_team_member(team_id, auth.uid())
);

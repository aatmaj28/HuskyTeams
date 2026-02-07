-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'looking' CHECK (status IN ('looking', 'in_team', 'open_to_offers')),
  team_size_preference INTEGER DEFAULT 3 CHECK (team_size_preference BETWEEN 2 AND 4),
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('email', 'discord', 'slack')),
  contact_handle TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create skills table (predefined skills)
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL
);

-- Create profile_skills table (skills a user has)
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE(profile_id, skill_id)
);

-- Create profile_looking_for table (skills a user is looking for)
CREATE TABLE IF NOT EXISTS public.profile_looking_for (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE(profile_id, skill_id)
);

-- Create availability table
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
  UNIQUE(profile_id, day_of_week, time_of_day)
);

-- Create project_interests table
CREATE TABLE IF NOT EXISTS public.project_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  UNIQUE(profile_id, interest)
);

-- Create interest_requests table (for team matching)
CREATE TABLE IF NOT EXISTS public.interest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_looking_for ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Skills RLS policies (everyone can read)
CREATE POLICY "skills_select_all" ON public.skills FOR SELECT USING (true);

-- Profile Skills RLS policies
CREATE POLICY "profile_skills_select_all" ON public.profile_skills FOR SELECT USING (true);
CREATE POLICY "profile_skills_insert_own" ON public.profile_skills FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "profile_skills_delete_own" ON public.profile_skills FOR DELETE USING (auth.uid() = profile_id);

-- Profile Looking For RLS policies
CREATE POLICY "profile_looking_for_select_all" ON public.profile_looking_for FOR SELECT USING (true);
CREATE POLICY "profile_looking_for_insert_own" ON public.profile_looking_for FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "profile_looking_for_delete_own" ON public.profile_looking_for FOR DELETE USING (auth.uid() = profile_id);

-- Availability RLS policies
CREATE POLICY "availability_select_all" ON public.availability FOR SELECT USING (true);
CREATE POLICY "availability_insert_own" ON public.availability FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "availability_update_own" ON public.availability FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "availability_delete_own" ON public.availability FOR DELETE USING (auth.uid() = profile_id);

-- Project Interests RLS policies
CREATE POLICY "project_interests_select_all" ON public.project_interests FOR SELECT USING (true);
CREATE POLICY "project_interests_insert_own" ON public.project_interests FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "project_interests_delete_own" ON public.project_interests FOR DELETE USING (auth.uid() = profile_id);

-- Interest Requests RLS policies
CREATE POLICY "interest_requests_select_involved" ON public.interest_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "interest_requests_insert_own" ON public.interest_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "interest_requests_update_involved" ON public.interest_requests FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "interest_requests_delete_own" ON public.interest_requests FOR DELETE USING (auth.uid() = from_user_id);

-- Teams RLS policies
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND profile_id = auth.uid())
);
CREATE POLICY "teams_insert_auth" ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "teams_update_leader" ON public.teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND profile_id = auth.uid() AND role = 'leader')
);

-- Team Members RLS policies
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.profile_id = auth.uid())
);
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.profile_id = auth.uid() AND tm.role = 'leader')
  OR NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id)
);
CREATE POLICY "team_members_delete_self_or_leader" ON public.team_members FOR DELETE USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.profile_id = auth.uid() AND tm.role = 'leader')
);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

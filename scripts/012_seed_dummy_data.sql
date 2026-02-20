-- Seed 54 users and 14 teams (run in Supabase SQL Editor)
-- Requires: pgcrypto extension (usually already enabled in Supabase)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Temp table to hold the 54 user ids we create
CREATE TEMP TABLE IF NOT EXISTS seed_user_ids (id uuid PRIMARY KEY, num int);

-- Clear if re-running
DELETE FROM seed_user_ids;
-- Remove existing seed data so script is re-runnable
DELETE FROM public.team_members WHERE team_id IN (SELECT id FROM public.teams WHERE description LIKE 'Seed team%');
DELETE FROM public.team_members WHERE profile_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.teams WHERE description LIKE 'Seed team%';
DELETE FROM public.profile_skills WHERE profile_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.profile_looking_for WHERE profile_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.availability WHERE profile_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.project_interests WHERE profile_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.interest_requests WHERE from_user_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %') OR to_user_id IN (SELECT id FROM public.profiles WHERE full_name LIKE 'Seed User %');
DELETE FROM public.profiles WHERE full_name LIKE 'Seed User %';
DELETE FROM auth.users WHERE email LIKE 'seed%@northeastern.edu';

-- 1) Insert 54 users into auth.users (trigger will create 54 profiles)
DO $$
DECLARE
  uid uuid;
  i int;
  inst_id uuid;
BEGIN
  -- Get instance_id from auth.instances or from an existing user
  SELECT id INTO inst_id FROM auth.instances LIMIT 1;
  IF inst_id IS NULL THEN
    SELECT instance_id INTO inst_id FROM auth.users LIMIT 1;
  END IF;
  IF inst_id IS NULL THEN
    RAISE EXCEPTION 'Could not find instance_id. Ensure you have at least one user (sign up once) or auth.instances has a row.';
  END IF;
  FOR i IN 1..54 LOOP
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, aud, role
    ) VALUES (
      uid,
      inst_id,
      'seed' || i || '@northeastern.edu',
      crypt('SeedPassword123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      ('{"full_name":"Seed User ' || i || '"}')::jsonb,
      'authenticated',
      'authenticated'
    );
    INSERT INTO seed_user_ids (id, num) VALUES (uid, i);
  END LOOP;
END $$;

-- 2) Update profiles: name, full_name, onboarding_completed, status, team_size_preference
UPDATE public.profiles p
SET
  name = 'Seed User ' || s.num,
  full_name = 'Seed User ' || s.num,
  onboarding_completed = true,
  status = 'looking',
  team_size_preference = 2 + (s.num % 3)
FROM seed_user_ids s
WHERE p.id = s.id;

-- 3) Profile skills (3 random skills per user)
INSERT INTO public.profile_skills (profile_id, skill_id)
SELECT s.id, sk.id
FROM seed_user_ids s
CROSS JOIN LATERAL (SELECT id FROM public.skills ORDER BY random() LIMIT 3) sk;

-- 4) Profile looking for (2 random skills per user)
INSERT INTO public.profile_looking_for (profile_id, skill_id)
SELECT s.id, sk.id
FROM seed_user_ids s
CROSS JOIN LATERAL (SELECT id FROM public.skills ORDER BY random() LIMIT 2) sk;

-- 5) Availability (2–3 slots per user: weekdays + morning/afternoon/evening)
INSERT INTO public.availability (profile_id, day_of_week, time_of_day)
SELECT s.id, d.d, t.t
FROM seed_user_ids s
CROSS JOIN (VALUES ('monday'), ('wednesday'), ('friday')) AS d(d)
CROSS JOIN (VALUES ('morning'), ('afternoon')) AS t(t)
WHERE (s.num + 1) % 3 != 0
UNION ALL
SELECT s.id, 'tuesday', 'evening'
FROM seed_user_ids s
WHERE s.num % 2 = 0;

-- 6) Project interests (2 per user)
INSERT INTO public.project_interests (profile_id, interest)
SELECT id, (ARRAY['ML project', 'Web app', 'Data analysis', 'NLP application', 'Computer vision', 'Recommendation system', 'Dashboard', 'API backend'])[1 + (num % 8)]
FROM seed_user_ids;
INSERT INTO public.project_interests (profile_id, interest)
SELECT id, (ARRAY['Research paper', 'Startup idea', 'Hackathon', 'Capstone'])[1 + (num % 4)]
FROM seed_user_ids
ON CONFLICT (profile_id, interest) DO NOTHING;

-- 7) Create 14 teams
INSERT INTO public.teams (name, description) VALUES
  ('Team Alpha', 'Seed team 1 – CS5130'),
  ('Team Beta', 'Seed team 2 – CS5130'),
  ('Team Gamma', 'Seed team 3 – CS5130'),
  ('Team Delta', 'Seed team 4 – CS5130'),
  ('Team Epsilon', 'Seed team 5 – CS5130'),
  ('Team Zeta', 'Seed team 6 – CS5130'),
  ('Team Eta', 'Seed team 7 – CS5130'),
  ('Team Theta', 'Seed team 8 – CS5130'),
  ('Team Iota', 'Seed team 9 – CS5130'),
  ('Team Kappa', 'Seed team 10 – CS5130'),
  ('Team Lambda', 'Seed team 11 – CS5130'),
  ('Team Mu', 'Seed team 12 – CS5130'),
  ('Team Nu', 'Seed team 13 – CS5130'),
  ('Team Xi', 'Seed team 14 – CS5130');

-- 8) Add team members (first 42 users → 14 teams × 3 members)
INSERT INTO public.team_members (team_id, profile_id, role)
SELECT t.id, s.id, 'member'
FROM (
  SELECT id, row_number() OVER (ORDER BY name) AS rn
  FROM public.teams
  WHERE description LIKE 'Seed team%'
) t
JOIN (
  SELECT id, row_number() OVER (ORDER BY num) AS rn
  FROM seed_user_ids
) s ON s.rn BETWEEN (t.rn - 1) * 3 + 1 AND t.rn * 3;

-- 9) Mark profiles in a team as in_team
UPDATE public.profiles
SET status = 'in_team'
WHERE id IN (SELECT profile_id FROM public.team_members);

-- Done
SELECT 'Seeded 54 users and 14 teams.' AS result;
SELECT (SELECT count(*) FROM public.profiles WHERE onboarding_completed = true) AS students,
       (SELECT count(*) FROM public.teams) AS teams;

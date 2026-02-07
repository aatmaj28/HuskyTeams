"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentCard } from "@/components/student-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { Button } from "@/components/ui/button";
import { Loader2, Filter, X, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { calculateCompatibilityScore } from "@/lib/compatibility-score";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface StudentProfile {
  id: string;
  name: string;
  major: string;
  graduation_year: number | null;
  bio: string | null;
  avatar_url: string | null;
  team_size_preference: number | null;
  status: string | null;
  skills: Skill[];
  looking_for: Skill[];
  availability: { day_of_week: string; time_slot: string }[];
  project_interests: string[];
}

interface ProfileWithScore extends StudentProfile {
  compatibilityScore?: number;
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<StudentProfile | null>(null);
  const [mutualInterests, setMutualInterests] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedProjectInterests, setSelectedProjectInterests] = useState<string[]>([]);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch current user's profile for compatibility scoring
      const { data: currentUserData } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          major,
          graduation_year,
          bio,
          avatar_url,
          team_size_preference,
          status,
          profile_skills(skill:skills(*)),
          profile_looking_for(skill:skills(*)),
          availability(day_of_week, time_of_day),
          project_interests(interest)
        `
        )
        .eq("id", user.id)
        .single();

      if (currentUserData) {
        const formattedCurrentUser: StudentProfile = {
          id: currentUserData.id,
          name: currentUserData.name || "Anonymous",
          major: currentUserData.major || "Undeclared",
          graduation_year: currentUserData.graduation_year,
          bio: currentUserData.bio,
          avatar_url: currentUserData.avatar_url,
          team_size_preference: currentUserData.team_size_preference,
          status: currentUserData.status,
          skills:
            currentUserData.profile_skills?.map((ps: { skill: Skill }) => ps.skill).filter(Boolean) ||
            [],
          looking_for:
            currentUserData.profile_looking_for
              ?.map((plf: { skill: Skill }) => plf.skill)
              .filter(Boolean) || [],
          availability: currentUserData.availability?.map((a: any) => ({
            day_of_week: a.day_of_week,
            time_slot: a.time_of_day || a.time_slot,
          })) || [],
          project_interests:
            currentUserData.project_interests?.map((pi: { interest: string }) => pi.interest) || [],
        };
        setCurrentUserProfile(formattedCurrentUser);
      }

      // Fetch profiles that have sent interest to current user (for mutual interest boost)
      const { data: interestData } = await supabase
        .from("interest_requests")
        .select("from_user_id")
        .eq("to_user_id", user.id)
        .eq("status", "pending");

      if (interestData) {
        setMutualInterests(new Set(interestData.map((r) => r.from_user_id)));
      }

      // Fetch skills
      const { data: skillsData } = await supabase.from("skills").select("*").order("category");
      if (skillsData) setSkills(skillsData);

      // Fetch profiles with their skills, availability, and preferences
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          major,
          graduation_year,
          bio,
          avatar_url,
          team_size_preference,
          status,
          profile_skills(skill:skills(*)),
          profile_looking_for(skill:skills(*)),
          availability(day_of_week, time_of_day),
          project_interests(interest)
        `
        )
        .eq("onboarding_completed", true)
        .order("created_at", { ascending: false });

      if (profilesData) {
        const formatted = profilesData
          .filter((p) => p.id !== user?.id && p.status !== "in_team") // Exclude current user and users already in teams
          .map((p: any) => ({
            id: p.id,
            name: p.name || "Anonymous",
            major: p.major || "Undeclared",
            graduation_year: p.graduation_year,
            bio: p.bio,
            avatar_url: p.avatar_url,
            team_size_preference: p.team_size_preference,
            status: p.status,
            skills: p.profile_skills?.map((ps: { skill: Skill }) => ps.skill).filter(Boolean) || [],
            looking_for:
              p.profile_looking_for?.map((plf: { skill: Skill }) => plf.skill).filter(Boolean) || [],
            availability: p.availability?.map((a: any) => ({
              day_of_week: a.day_of_week,
              time_slot: a.time_of_day || a.time_slot,
            })) || [],
            project_interests: p.project_interests?.map((pi: { interest: string }) => pi.interest) || [],
          }));
        setProfiles(formatted);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const filteredProfiles = useMemo(() => {
    // First apply filters
    const filtered = profiles.filter((profile) => {
      let matchCount = 0;
      const totalFilters = 
        (searchQuery ? 1 : 0) +
        (selectedSkills.length > 0 ? 1 : 0) +
        (selectedAvailability.length > 0 ? 1 : 0) +
        (selectedProjectInterests.length > 0 ? 1 : 0) +
        (selectedTeamSize !== null ? 1 : 0) +
        (selectedStatus !== null ? 1 : 0);

      // If no filters, show all
      if (totalFilters === 0) return true;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = profile.name.toLowerCase().includes(query);
        const matchesMajor = profile.major.toLowerCase().includes(query);
        if (matchesName || matchesMajor) matchCount++;
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const profileSkillIds = profile.skills.map((s) => s.id);
        const hasMatchingSkill = selectedSkills.some((skillId) =>
          profileSkillIds.includes(skillId)
        );
        if (hasMatchingSkill) matchCount++;
      }

      // Availability filter
      if (selectedAvailability.length > 0) {
        const DAYS_MAP: Record<string, string> = {
          "Mon": "monday", "Tue": "tuesday", "Wed": "wednesday",
          "Thu": "thursday", "Fri": "friday", "Sat": "saturday", "Sun": "sunday"
        };
        const profileDays = new Set(profile.availability.map((a) => a.day_of_week));
        const hasMatchingDay = selectedAvailability.some((day) => 
          profileDays.has(DAYS_MAP[day] || day.toLowerCase())
        );
        if (hasMatchingDay) matchCount++;
      }

      // Project interests filter
      if (selectedProjectInterests.length > 0) {
        const hasMatchingInterest = selectedProjectInterests.some((interest) =>
          profile.project_interests?.some((pi) => 
            pi.toLowerCase().includes(interest.toLowerCase())
          )
        );
        if (hasMatchingInterest) matchCount++;
      }

      // Team size filter
      if (selectedTeamSize !== null) {
        if (profile.team_size_preference === selectedTeamSize) matchCount++;
      }

      // Status filter
      if (selectedStatus !== null) {
        if (profile.status === selectedStatus) matchCount++;
      }

      // Show if matches at least 2 filters (or all if less than 2 filters selected)
      return matchCount >= Math.min(2, totalFilters);
    });

    // Then calculate compatibility scores and sort
    if (!currentUserProfile) {
      return filtered;
    }

    const profilesWithScores: ProfileWithScore[] = filtered.map((profile) => {
      const hasMutualInterest = mutualInterests.has(profile.id);
      const score = calculateCompatibilityScore(currentUserProfile, profile, hasMutualInterest);
      return {
        ...profile,
        compatibilityScore: score.total,
      };
    });

    // Sort by compatibility score (highest first)
    return profilesWithScores.sort((a, b) => {
      const scoreA = a.compatibilityScore ?? 0;
      const scoreB = b.compatibilityScore ?? 0;
      return scoreB - scoreA;
    });
  }, [
    profiles,
    currentUserProfile,
    mutualInterests,
    searchQuery,
    selectedSkills,
    selectedAvailability,
    selectedProjectInterests,
    selectedTeamSize,
    selectedStatus,
  ]);

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const handleAvailabilityToggle = (day: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedAvailability([]);
    setSelectedProjectInterests([]);
    setSelectedTeamSize(null);
    setSelectedStatus(null);
  };

  const hasFilters =
    searchQuery.length > 0 || 
    selectedSkills.length > 0 || 
    selectedAvailability.length > 0 ||
    selectedProjectInterests.length > 0 ||
    selectedTeamSize !== null ||
    selectedStatus !== null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <FilterSidebar
          skills={skills}
          selectedSkills={selectedSkills}
          selectedAvailability={selectedAvailability}
          selectedProjectInterests={selectedProjectInterests}
          selectedTeamSize={selectedTeamSize}
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          onSkillToggle={handleSkillToggle}
          onAvailabilityToggle={handleAvailabilityToggle}
          onProjectInterestToggle={setSelectedProjectInterests}
          onTeamSizeChange={setSelectedTeamSize}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
          allProfiles={profiles}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Teammates</h1>
            <p className="text-sm text-muted-foreground">
              {filteredProfiles.length} student{filteredProfiles.length !== 1 ? "s" : ""} found
              {hasFilters && " matching your filters"}
              {currentUserProfile && " • Sorted by compatibility"}
            </p>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 lg:hidden bg-transparent">
                <Filter className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {selectedSkills.length + selectedAvailability.length + selectedProjectInterests.length + (searchQuery ? 1 : 0) + (selectedTeamSize !== null ? 1 : 0) + (selectedStatus !== null ? 1 : 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar
                  skills={skills}
                  selectedSkills={selectedSkills}
                  selectedAvailability={selectedAvailability}
                  selectedProjectInterests={selectedProjectInterests}
                  selectedTeamSize={selectedTeamSize}
                  selectedStatus={selectedStatus}
                  searchQuery={searchQuery}
                  onSkillToggle={handleSkillToggle}
                  onAvailabilityToggle={handleAvailabilityToggle}
                  onProjectInterestToggle={setSelectedProjectInterests}
                  onTeamSizeChange={setSelectedTeamSize}
                  onStatusChange={setSelectedStatus}
                  onSearchChange={setSearchQuery}
                  onClearFilters={handleClearFilters}
                  allProfiles={profiles}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        {filteredProfiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <StudentCard
                key={profile.id}
                profile={profile}
                currentUserId={currentUserId}
                compatibilityScore={(profile as ProfileWithScore).compatibilityScore}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No students found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? "Try adjusting your filters to see more results."
                : "No other students have completed their profiles yet."}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

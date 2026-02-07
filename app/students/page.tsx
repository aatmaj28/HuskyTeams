"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Loader2,
  Search,
  Grid3x3,
  List,
  ExternalLink,
  Send,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { StudentCard } from "@/components/student-card";

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
  skills: Skill[];
  looking_for: Skill[];
  availability: { day_of_week: string; time_slot: string }[];
}

export default function StudentsPage() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    // Fetch all profiles with their skills and availability
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
        profile_skills(skill:skills(*)),
        profile_looking_for(skill:skills(*)),
        availability(day_of_week, time_of_day)
      `
      )
      .eq("onboarding_completed", true)
      .neq("status", "in_team") // Exclude users already in teams
      .order("created_at", { ascending: false });

    if (profilesData) {
      const formatted = profilesData.map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        major: profile.major,
        graduation_year: profile.graduation_year,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        skills: profile.profile_skills?.map((ps: any) => ps.skill) || [],
        looking_for: profile.profile_looking_for?.map((plf: any) => plf.skill) || [],
        availability: profile.availability?.map((a: any) => ({
          day_of_week: a.day_of_week,
          time_slot: a.time_of_day || a.time_slot,
        })) || [],
      }));
      setProfiles(formatted);
    }

    setLoading(false);
  }

  const filteredProfiles = profiles.filter((profile) => {
    if (profile.id === currentUserId) return false; // Don't show current user
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(query) ||
      profile.major?.toLowerCase().includes(query) ||
      profile.skills.some((s) => s.name.toLowerCase().includes(query)) ||
      profile.looking_for.some((s) => s.name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Students</h1>
          <p className="text-sm text-muted-foreground">
            Browse and connect with {profiles.length} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, major, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredProfiles.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex min-h-[30vh] flex-col items-center justify-center p-8 text-center">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No students found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No students have completed their profiles yet"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <StudentCard key={profile.id} profile={profile} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {profile.major}
                          {profile.graduation_year && ` • Class of ${profile.graduation_year}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/profile/${profile.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            View Profile
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/profile/${profile.id}`}>
                          <Button size="sm" className="gap-2">
                            <Send className="h-4 w-4" />
                            Send Interest
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {profile.bio && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill.id} variant="default" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                      {profile.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                    {profile.looking_for.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground">Looking for:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {profile.looking_for.slice(0, 3).map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

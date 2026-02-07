"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Loader2,
  Plus,
  Users,
  ExternalLink,
  UserMinus,
  LogOut,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  major: string;
  avatar_url: string | null;
}

interface TeamMember {
  id: string;
  profile_id: string;
  role: "member";
  joined_at: string;
  profile: Profile;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  members: TeamMember[];
}

interface Match {
  id: string;
  profile: Profile;
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUserId(user.id);

    // Use API route to bypass RLS issues
    console.log("Loading team for user:", user.id);
    try {
      const response = await fetch(`/api/teams/get?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching team:", data.error);
        if (!team) {
          setTeam(null);
        }
      } else if (data.team) {
        console.log("Team data fetched successfully:", data.team);
        setTeam(data.team as Team);
      } else {
        console.log("No team found for user");
        setTeam(null);
      }
    } catch (error: any) {
      console.error("Error fetching team via API:", error);
      if (!team) {
        setTeam(null);
      }
    }

    // Fetch matches to potentially add to team
    // Only get matches who are still "looking" (not already in a team)
    const { data: requestsFromMe, error: errorFromMe } = await supabase
      .from("interest_requests")
      .select("to_user_id")
      .eq("from_user_id", user.id)
      .eq("status", "accepted");

    if (errorFromMe) {
      console.error("Error fetching requests from me:", errorFromMe);
    }

    const { data: requestsToMe, error: errorToMe } = await supabase
      .from("interest_requests")
      .select("from_user_id")
      .eq("to_user_id", user.id)
      .eq("status", "accepted");

    if (errorToMe) {
      console.error("Error fetching requests to me:", errorToMe);
    }

    console.log("Requests from me:", requestsFromMe);
    console.log("Requests to me:", requestsToMe);

    // Collect all matched user IDs
    const matchedUserIds = new Set<string>();
    requestsFromMe?.forEach((r: any) => {
      if (r.to_user_id) matchedUserIds.add(r.to_user_id);
    });
    requestsToMe?.forEach((r: any) => {
      if (r.from_user_id) matchedUserIds.add(r.from_user_id);
    });

    console.log("Matched user IDs:", Array.from(matchedUserIds));

    // Fetch profiles for all matched users
    const matchedProfiles: Match[] = [];
    if (matchedUserIds.size > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, major, avatar_url, status")
        .in("id", Array.from(matchedUserIds))
        .neq("status", "in_team"); // Only get profiles that are still "looking"

      if (profilesError) {
        console.error("Error fetching matched profiles:", profilesError);
      } else {
        console.log("Fetched matched profiles:", profiles);
        profiles?.forEach((profile: any) => {
          matchedProfiles.push({
            id: profile.id,
            profile: {
              id: profile.id,
              name: profile.name || "Unknown",
              major: profile.major || "",
              avatar_url: profile.avatar_url,
              status: profile.status,
            } as Profile,
          });
        });
      }
    }

    console.log("Final matched profiles:", matchedProfiles);
    setMatches(matchedProfiles);
    setLoading(false);
  }

  const handleCreateTeam = async () => {
    if (!currentUserId || !teamName.trim()) return;
    setCreating(true);

    try {
      // Use API route to bypass RLS
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamName.trim(),
          teamDescription: teamDescription.trim() || null,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to create team: ${data.error || "Unknown error"}`);
        setCreating(false);
        return;
      }

      // Team created successfully
      console.log("Team created successfully:", data);
      
      setCreateDialogOpen(false);
      setTeamName("");
      setTeamDescription("");
      setCreating(false);
      
      // Fetch the current user's profile to build the team member object
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (data.team && data.member && user) {
        // Fetch current user's profile for the team member display
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, name, major, avatar_url")
          .eq("id", user.id)
          .single();
        
        // Build the team object directly from API response
        // This avoids RLS issues by not querying immediately after creation
        const teamData: Team = {
          id: data.team.id,
          name: data.team.name,
          description: data.team.description,
          created_at: data.team.created_at,
          members: [{
            id: data.member.id,
            profile_id: data.member.profile_id,
            role: data.member.role,
            joined_at: data.member.joined_at,
            profile: userProfile || {
              id: user.id,
              name: "You",
              major: "",
              avatar_url: null,
            },
          }],
        };
        
        console.log("Setting team data directly from API response:", teamData);
        setTeam(teamData);
        
        // Reload matches and full team data after a delay
        // This ensures RLS policies have propagated
        // We pass a flag to prevent clearing the team if the query fails
        setTimeout(async () => {
          // Only reload matches, don't reload team if we already have it
          const supabase = createClient();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser) {
            // Just reload matches, keep the existing team
            // Fetch matches to potentially add to team
            const { data: requestsFromMe } = await supabase
              .from("interest_requests")
              .select("to_user_id")
              .eq("from_user_id", currentUser.id)
              .eq("status", "accepted");

            const { data: requestsToMe } = await supabase
              .from("interest_requests")
              .select("from_user_id")
              .eq("to_user_id", currentUser.id)
              .eq("status", "accepted");

            const matchedUserIds = new Set<string>();
            requestsFromMe?.forEach((r: any) => {
              if (r.to_user_id) matchedUserIds.add(r.to_user_id);
            });
            requestsToMe?.forEach((r: any) => {
              if (r.from_user_id) matchedUserIds.add(r.from_user_id);
            });

            if (matchedUserIds.size > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name, major, avatar_url, status")
                .in("id", Array.from(matchedUserIds))
                .neq("status", "in_team");

              const matchedProfiles: Match[] = [];
              profiles?.forEach((profile: any) => {
                matchedProfiles.push({
                  id: profile.id,
                  profile: {
                    id: profile.id,
                    name: profile.name || "Unknown",
                    major: profile.major || "",
                    avatar_url: profile.avatar_url,
                    status: profile.status,
                  } as Profile,
                });
              });
              setMatches(matchedProfiles);
            }
            
            // Try to refresh team data, but don't clear if it fails
            try {
              const { data: memberData } = await supabase
                .from("team_members")
                .select("team_id")
                .eq("profile_id", currentUser.id)
                .maybeSingle();

              if (memberData?.team_id) {
                const { data: teamData } = await supabase
                  .from("teams")
                  .select(
                    `
                    *,
                    members:team_members(
                      id,
                      profile_id,
                      role,
                      joined_at,
                      profile:profiles(id, name, major, avatar_url)
                    )
                  `
                  )
                  .eq("id", memberData.team_id)
                  .single();

                if (teamData) {
                  setTeam(teamData as Team);
                }
              }
            } catch (error) {
              // Silently fail - keep existing team
              console.log("Could not refresh team data, keeping existing team");
            }
          }
        }, 2000);
      } else {
        // Fall back to reloading if API response doesn't have expected data
        await new Promise(resolve => setTimeout(resolve, 1500));
        await loadTeam();
      }
    } catch (error: any) {
      console.error("Error creating team:", error);
      alert(`Failed to create team: ${error.message || "Unknown error"}`);
      setCreating(false);
    }
  };

  const handleAddMember = async (profileId: string) => {
    if (!team || !currentUserId) return;
    setAddingMember(profileId);

    try {
      // Use API route to bypass RLS
      const response = await fetch("/api/teams/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          profileId: profileId,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to add member: ${data.error || "Unknown error"}`);
        setAddingMember(null);
        return;
      }

      // Member added successfully
      console.log("Member added successfully:", data);
      
      setAddingMember(null);
      setAddMemberDialogOpen(false);
      
      // Reload team data to show the new member
      await loadTeam();
    } catch (error: any) {
      console.error("Error adding member:", error);
      alert(`Failed to add member: ${error.message || "Unknown error"}`);
      setAddingMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string, profileId: string) => {
    setRemovingMember(memberId);
    const supabase = createClient();

    await supabase.from("team_members").delete().eq("id", memberId);

    // Update removed member's status back to "looking"
    const { error: statusError } = await supabase
      .from("profiles")
      .update({ status: "looking" })
      .eq("id", profileId);

    if (statusError) {
      console.error("Error updating removed member status:", statusError);
    }

    setRemovingMember(null);
    await loadTeam();
  };

  const handleLeaveTeam = async () => {
    if (!currentUserId || !team) return;

    try {
      // Use API route to bypass RLS
      const response = await fetch("/api/teams/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to leave team: ${data.error || "Unknown error"}`);
        return;
      }

      // Successfully left team - clear team state and reload
      setTeam(null);
      await loadTeam();
    } catch (error: any) {
      console.error("Error leaving team:", error);
      alert(`Failed to leave team: ${error.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No team yet
  if (!team) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground">Create or join a project team</p>
        </div>

        {/* Matched Classmates Section */}
        {matches.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Matched Classmates
              </CardTitle>
              <CardDescription>
                You have {matches.length} matched classmate{matches.length !== 1 ? "s" : ""}. Create
                a team to start collaborating!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {match.profile.avatar_url ? (
                        <img
                          src={match.profile.avatar_url || "/placeholder.svg"}
                          alt={match.profile.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{match.profile.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {match.profile.major}
                      </p>
                    </div>
                    <Link href={`/profile/${match.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Team Section */}
        <Card className="border-border border-dashed">
          <CardContent className="flex min-h-[40vh] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No team yet</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              {matches.length > 0
                ? "Create a team by giving it a name and description, then add your matched classmates to start collaborating."
                : "Create a new team to start collaborating with your matched teammates."}
            </p>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                  <DialogDescription>
                    Give your team a name and description to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      placeholder="e.g., Project Phoenix"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamDescription">Description</Label>
                    <Textarea
                      id="teamDescription"
                      placeholder="What is your team working on?"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={creating || !teamName.trim()}>
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has a team
  const availableMatches = matches.filter(
    (match) => !team.members.some((m) => m.profile_id === match.id)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          {team.description && <p className="mt-1 text-muted-foreground">{team.description}</p>}
        </div>
        <div className="flex gap-2">
          {availableMatches.length > 0 && (
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Invite one of your matched connections to join the team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  {availableMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {match.profile.avatar_url ? (
                            <img
                              src={match.profile.avatar_url || "/placeholder.svg"}
                              alt={match.profile.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{match.profile.name}</p>
                          <p className="text-sm text-muted-foreground">{match.profile.major}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(match.id)}
                        disabled={addingMember === match.id}
                      >
                        {addingMember === match.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive bg-transparent">
                <LogOut className="h-4 w-4" />
                Leave Team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this team?</AlertDialogTitle>
                <AlertDialogDescription>
                  {team.members.length > 1
                    ? "You will be removed from the team. You can be added back by any team member."
                    : "As the last member, the team will be deleted."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Leave Team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Team Members */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </CardDescription>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect with your teammates via the email on their profile
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {member.profile.avatar_url ? (
                      <img
                        src={member.profile.avatar_url || "/placeholder.svg"}
                        alt={member.profile.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{member.profile.name}</p>
                      {member.profile_id === currentUserId && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.profile.major}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${member.profile_id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  {member.profile_id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={removingMember === member.id}
                        >
                          {removingMember === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {member.profile.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove them from the team. They can be added back later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id, member.profile_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Potential Members */}
      {availableMatches.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Matched Connections
            </CardTitle>
            <CardDescription>
              These matched students are not yet on a team and could join yours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {match.profile.avatar_url ? (
                        <img
                          src={match.profile.avatar_url || "/placeholder.svg"}
                          alt={match.profile.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{match.profile.name}</p>
                      <p className="text-sm text-muted-foreground">{match.profile.major}</p>
                    </div>
                  </div>
                  {(
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddMember(match.id)}
                      disabled={addingMember === match.id}
                    >
                      {addingMember === match.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  User,
  GraduationCap,
  Calendar,
  Loader2,
  ArrowLeft,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Github,
  Linkedin,
  Globe,
  Send,
  Mail,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Profile {
  id: string;
  name: string;
  major: string;
  graduation_year: number | null;
  bio: string | null;
  avatar_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: Skill[];
  looking_for: Skill[];
  availability: { day_of_week: string; time_of_day: string }[];
}

type InterestStatus = "none" | "pending" | "accepted" | "declined" | "mutual";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["morning", "afternoon", "evening"];

// Map full day names to short names
const DAY_NAME_MAP: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [interestStatus, setInterestStatus] = useState<InterestStatus>("none");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          major,
          graduation_year,
          bio,
          avatar_url,
          github_url,
          linkedin_url,
          portfolio_url,
          profile_skills(skill:skills(*)),
          profile_looking_for(skill:skills(*)),
          availability(day_of_week, time_of_day)
        `
        )
        .eq("id", id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          name: profileData.name || "Anonymous",
          major: profileData.major || "Undeclared",
          graduation_year: profileData.graduation_year,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          github_url: profileData.github_url,
          linkedin_url: profileData.linkedin_url,
          portfolio_url: profileData.portfolio_url,
          skills:
            profileData.profile_skills?.map((ps: { skill: Skill }) => ps.skill).filter(Boolean) ||
            [],
          looking_for:
            profileData.profile_looking_for
              ?.map((plf: { skill: Skill }) => plf.skill)
              .filter(Boolean) || [],
          availability: profileData.availability || [],
        });

        // Fetch user email
        try {
          const emailResponse = await fetch(`/api/users/email?userId=${id}`);
          const emailData = await emailResponse.json();
          if (emailData.success && emailData.email) {
            setUserEmail(emailData.email);
          }
        } catch (error) {
          console.error("Error fetching user email:", error);
        }

        // Check interest status
        const { data: sentRequest } = await supabase
          .from("interest_requests")
          .select("status")
          .eq("from_user_id", user.id)
          .eq("to_user_id", id)
          .single();

        const { data: receivedRequest } = await supabase
          .from("interest_requests")
          .select("status")
          .eq("from_user_id", id)
          .eq("to_user_id", user.id)
          .single();

        if (sentRequest?.status === "accepted" || receivedRequest?.status === "accepted") {
          setInterestStatus("mutual");
        } else if (sentRequest) {
          setInterestStatus(sentRequest.status as InterestStatus);
        } else if (receivedRequest?.status === "pending") {
          setInterestStatus("pending");
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [id, router]);

  const handleSendInterest = async () => {
    if (!currentUserId || !profile) return;
    setSendingInterest(true);

    const supabase = createClient();

    const { error } = await supabase.from("interest_requests").insert({
      from_user_id: currentUserId,
      to_user_id: profile.id,
      message: interestMessage || null,
    });

    if (!error) {
      setInterestStatus("pending");
      setDialogOpen(false);
      setInterestMessage("");
    }

    setSendingInterest(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">This profile does not exist or has been removed.</p>
        <Link href="/dashboard" className="mt-4">
          <Button variant="outline" className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const availabilityMap = new Set(
    profile.availability.map((a) => {
      const shortDay = DAY_NAME_MAP[a.day_of_week.toLowerCase()] || a.day_of_week;
      return `${shortDay}-${a.time_of_day}`;
    })
  );

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-primary" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {profile.major}
              </span>
              {profile.graduation_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Class of {profile.graduation_year}
                </span>
              )}
              {userEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${userEmail}`} className="hover:text-foreground hover:underline">
                    {userEmail}
                  </a>
                </span>
              )}
            </div>

            {/* Social Links */}
            <div className="mt-3 flex gap-2">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Interest Button */}
          {!isOwnProfile && (
            <div className="w-full sm:w-auto">
              {interestStatus === "none" && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2 sm:w-auto">
                      <Heart className="h-4 w-4" />
                      Express Interest
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Express Interest in {profile.name}</DialogTitle>
                      <DialogDescription>
                        Send a message introducing yourself and why you would like to work together.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Hi! I saw your profile and think we'd make a great team because..."
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      rows={4}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendInterest} disabled={sendingInterest} className="gap-2">
                        {sendingInterest ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Interest
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {interestStatus === "pending" && (
                <Button variant="outline" disabled className="w-full gap-2 sm:w-auto bg-transparent">
                  <Clock className="h-4 w-4" />
                  Interest Pending
                </Button>
              )}
              {interestStatus === "mutual" && (
                <Button variant="outline" className="w-full gap-2 sm:w-auto text-primary border-primary bg-transparent">
                  <CheckCircle2 className="h-4 w-4" />
                  Matched!
                </Button>
              )}
              {interestStatus === "declined" && (
                <Button variant="outline" disabled className="w-full gap-2 sm:w-auto bg-transparent">
                  <XCircle className="h-4 w-4" />
                  Declined
                </Button>
              )}
              {interestStatus === "accepted" && (
                <Button variant="outline" className="w-full gap-2 sm:w-auto text-primary border-primary bg-transparent">
                  <CheckCircle2 className="h-4 w-4" />
                  Interest Accepted
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="mt-8 border-border">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Skills */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills listed</p>
              )}
            </CardContent>
          </Card>

          {/* Looking For */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Looking For</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.looking_for.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((skill) => (
                    <Badge key={skill.id} variant="outline" className="border-accent/50 text-accent">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No preferences listed</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Availability */}
        <Card className="mt-8 border-border">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground" />
                    {DAYS.map((day) => (
                      <th key={day} className="p-2 text-center text-sm font-medium text-foreground">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot}>
                      <td className="p-2 text-sm capitalize text-muted-foreground">{slot}</td>
                      {DAYS.map((day) => {
                        const key = `${day}-${slot}`;
                        const isAvailable = availabilityMap.has(key);
                        return (
                          <td key={key} className="p-1">
                            <div
                              className={`h-10 w-full rounded-md ${
                                isAvailable ? "bg-primary/20" : "bg-muted"
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-primary/20" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-muted" />
                <span className="text-muted-foreground">Not available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

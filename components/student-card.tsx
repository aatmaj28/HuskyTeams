"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ExternalLink,
  Heart,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

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

interface StudentCardProps {
  profile: StudentProfile;
  showViewButton?: boolean;
  currentUserId?: string | null;
  compatibilityScore?: number;
}

type InterestStatus = "none" | "pending" | "accepted" | "declined" | "mutual";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export function StudentCard({
  profile,
  showViewButton = true,
  currentUserId: propCurrentUserId,
  compatibilityScore,
}: StudentCardProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId || null);
  const [interestStatus, setInterestStatus] = useState<InterestStatus>("none");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const router = useRouter();

  const availabilityMap = new Set(
    profile.availability.map((a) => {
      const shortDay = DAY_NAME_MAP[a.day_of_week.toLowerCase()] || a.day_of_week;
      return `${shortDay}-${a.time_slot}`;
    })
  );

  useEffect(() => {
    async function loadInterestStatus() {
      if (!currentUserId) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await checkInterestStatus(user.id);
        } else {
          setLoadingStatus(false);
        }
      } else {
        await checkInterestStatus(currentUserId);
      }
    }

    async function checkInterestStatus(userId: string) {
      if (userId === profile.id) {
        setLoadingStatus(false);
        return; // Don't show interest button for own profile
      }

      const supabase = createClient();

      const { data: sentRequest } = await supabase
        .from("interest_requests")
        .select("status")
        .eq("from_user_id", userId)
        .eq("to_user_id", profile.id)
        .single();

      const { data: receivedRequest } = await supabase
        .from("interest_requests")
        .select("status")
        .eq("from_user_id", profile.id)
        .eq("to_user_id", userId)
        .single();

      if (sentRequest?.status === "accepted" || receivedRequest?.status === "accepted") {
        setInterestStatus("mutual");
      } else if (sentRequest) {
        setInterestStatus(sentRequest.status as InterestStatus);
      } else if (receivedRequest?.status === "pending") {
        setInterestStatus("pending");
      }

      setLoadingStatus(false);
    }

    loadInterestStatus();
  }, [profile.id, currentUserId]);

  const handleSendInterest = async () => {
    if (!currentUserId || currentUserId === profile.id) return;
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
      // Refresh the page to update the UI
      router.refresh();
    }

    setSendingInterest(false);
  };

  const isOwnProfile = currentUserId === profile.id;

  return (
    <Card className="group overflow-hidden border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">{profile.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
            </div>
          </div>
        </div>

        {/* Compatibility Score */}
        {compatibilityScore !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Compatibility</span>
              <Badge
                variant={compatibilityScore >= 70 ? "default" : compatibilityScore >= 50 ? "secondary" : "outline"}
                className="text-xs"
              >
                {compatibilityScore}%
              </Badge>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  compatibilityScore >= 70
                    ? "bg-primary"
                    : compatibilityScore >= 50
                    ? "bg-primary/70"
                    : "bg-primary/40"
                }`}
                style={{ width: `${compatibilityScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 6).map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {skill.name}
                </Badge>
              ))}
              {profile.skills.length > 6 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{profile.skills.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Looking For */}
        {profile.looking_for.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Looking for
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.looking_for.slice(0, 4).map((skill) => (
                <Badge
                  key={skill.id}
                  variant="outline"
                  className="border-accent/50 text-accent"
                >
                  {skill.name}
                </Badge>
              ))}
              {profile.looking_for.length > 4 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{profile.looking_for.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Availability Mini Grid */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Availability
          </p>
          <div className="flex gap-1">
            {DAYS.map((day) => {
              const hasAvailability = ["morning", "afternoon", "evening"].some((slot) =>
                availabilityMap.has(`${day}-${slot}`)
              );
              return (
                <div
                  key={day}
                  className={`h-6 w-6 rounded text-center text-xs leading-6 ${
                    hasAvailability
                      ? "bg-primary/20 font-medium text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={`${day}: ${hasAvailability ? "Available" : "Not available"}`}
                >
                  {day.charAt(0)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {showViewButton && (
          <div className="mt-5">
            <Link href={`/profile/${profile.id}`}>
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                View Profile
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>

            {/* Express Interest Button */}
            {!isOwnProfile && !loadingStatus && (
              <div className="mt-3">
                {interestStatus === "none" && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full gap-2">
                        <Heart className="h-4 w-4" />
                        Express Interest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Express Interest in {profile.name}</DialogTitle>
                        <DialogDescription>
                          Send a message introducing yourself and why you would like to work
                          together.
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
                  <Button variant="outline" disabled size="sm" className="w-full gap-2 bg-transparent">
                    <Clock className="h-4 w-4" />
                    Interest Pending
                  </Button>
                )}
                {interestStatus === "mutual" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary text-primary bg-transparent"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Matched!
                  </Button>
                )}
                {interestStatus === "declined" && (
                  <Button variant="outline" disabled size="sm" className="w-full gap-2 bg-transparent">
                    <XCircle className="h-4 w-4" />
                    Declined
                  </Button>
                )}
                {interestStatus === "accepted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary text-primary bg-transparent"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Interest Accepted
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

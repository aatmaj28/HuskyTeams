"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Loader2,
  Check,
  X,
  Clock,
  MessageSquare,
  ExternalLink,
  Inbox,
  Send,
  Users,
  ArrowLeft,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  major: string;
  avatar_url: string | null;
}

interface InterestRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export default function RequestsPage() {
  const [loading, setLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<InterestRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<InterestRequest[]>([]);
  const [matches, setMatches] = useState<InterestRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUserId(user.id);

    // Fetch received requests
    const { data: received } = await supabase
      .from("interest_requests")
      .select(
        `
        *,
        from_profile:profiles!from_user_id(id, name, major, avatar_url)
      `
      )
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch sent requests
    const { data: sent } = await supabase
      .from("interest_requests")
      .select(
        `
        *,
        to_profile:profiles!to_user_id(id, name, major, avatar_url)
      `
      )
      .eq("from_user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch matches (mutual interest - both accepted)
    const { data: matchData } = await supabase
      .from("interest_requests")
      .select(
        `
        *,
        from_profile:profiles!from_user_id(id, name, major, avatar_url),
        to_profile:profiles!to_user_id(id, name, major, avatar_url)
      `
      )
      .eq("status", "accepted")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (received) setReceivedRequests(received as InterestRequest[]);
    if (sent) setSentRequests(sent as InterestRequest[]);
    if (matchData) setMatches(matchData as InterestRequest[]);

    setLoading(false);
  }

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    const supabase = createClient();

    await supabase.from("interest_requests").update({ status: "accepted" }).eq("id", requestId);

    await loadRequests();
    setProcessingId(null);
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    const supabase = createClient();

    await supabase.from("interest_requests").update({ status: "declined" }).eq("id", requestId);

    await loadRequests();
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingSentCount = sentRequests.filter((r) => r.status === "pending").length;

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
        <h1 className="text-2xl font-bold text-foreground">Interest Requests</h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming requests and see your matches
        </p>
      </div>

      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Received
            {receivedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
            {pendingSentCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {pendingSentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <Users className="h-4 w-4" />
            Matches
            {matches.length > 0 && (
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-primary">{matches.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Received Requests */}
        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length > 0 ? (
            receivedRequests.map((request) => (
              <Card key={request.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {request.from_profile?.avatar_url ? (
                        <img
                          src={request.from_profile.avatar_url || "/placeholder.svg"}
                          alt={request.from_profile.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.from_profile?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.from_profile?.major || "Unknown major"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {request.message && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted p-3">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <p className="text-sm text-foreground">{request.message}</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                          disabled={processingId === request.id}
                          className="gap-2"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(request.id)}
                          disabled={processingId === request.id}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                        <Link href={`/profile/${request.from_user_id}`}>
                          <Button size="sm" variant="ghost" className="gap-2">
                            View Profile
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Inbox}
              title="No pending requests"
              description="When someone expresses interest in you, it will appear here."
            />
          )}
        </TabsContent>

        {/* Sent Requests */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length > 0 ? (
            sentRequests.map((request) => (
              <Card key={request.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {request.to_profile?.avatar_url ? (
                        <img
                          src={request.to_profile.avatar_url || "/placeholder.svg"}
                          alt={request.to_profile.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.to_profile?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.to_profile?.major || "Unknown major"}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>

                      {request.message && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted p-3">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <p className="text-sm text-foreground">{request.message}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <Link href={`/profile/${request.to_user_id}`}>
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            View Profile
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Send}
              title="No sent requests"
              description="Express interest in students from the Browse page to get started."
            />
          )}
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches" className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => {
              const otherProfile =
                match.from_user_id === currentUserId ? match.to_profile : match.from_profile;
              return (
                <Card key={match.id} className="border-border border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        {otherProfile?.avatar_url ? (
                          <img
                            src={otherProfile.avatar_url || "/placeholder.svg"}
                            alt={otherProfile.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">
                          {otherProfile?.name || "Unknown"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {otherProfile?.major || "Unknown major"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="gap-1 bg-primary">
                          <Check className="h-3 w-3" />
                          Matched
                        </Badge>
                        <Link href={`/profile/${otherProfile?.id}`}>
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            View
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={Users}
              title="No matches yet"
              description="When you and another student both accept each other's interest, you'll be matched!"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="gap-1 bg-primary">
          <Check className="h-3 w-3" />
          Accepted
        </Badge>
      );
    case "declined":
      return (
        <Badge variant="secondary" className="gap-1">
          <X className="h-3 w-3" />
          Declined
        </Badge>
      );
    default:
      return null;
  }
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

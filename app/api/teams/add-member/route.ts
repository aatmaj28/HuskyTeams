import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { teamId, profileId, userId } = await request.json();

    if (!teamId || !profileId || !userId) {
      return NextResponse.json(
        { error: "Team ID, profile ID, and user ID are required" },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify that the user is a member of the team
    const { data: userMembership, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("team_id", teamId)
      .eq("profile_id", userId)
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: "You must be a member of the team to add members" },
        { status: 403 }
      );
    }

    // Check if the profile is already in a team
    const { data: existingMembership } = await supabase
      .from("team_members")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: "This student is already in a team" },
        { status: 400 }
      );
    }

    // Check team size (max 4 members)
    const { data: currentMembers, error: countError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check team size" },
        { status: 500 }
      );
    }

    if (currentMembers && currentMembers.length >= 4) {
      return NextResponse.json(
        { error: "Team is full (maximum 4 members)" },
        { status: 400 }
      );
    }

    // Add member to team
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        profile_id: profileId,
        role: "member",
      })
      .select()
      .single();

    if (memberError || !memberData) {
      console.error("Error adding team member:", memberError);
      return NextResponse.json(
        { error: memberError?.message || "Failed to add member to team" },
        { status: 500 }
      );
    }

    // Update added member's status to "in_team"
    const { error: statusError } = await supabase
      .from("profiles")
      .update({ status: "in_team" })
      .eq("id", profileId);

    if (statusError) {
      console.error("Error updating member status:", statusError);
      // Don't fail the request, but log the error
    }

    console.log("Team member added successfully:", memberData);

    return NextResponse.json({
      success: true,
      member: memberData,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

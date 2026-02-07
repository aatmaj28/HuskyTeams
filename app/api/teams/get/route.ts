import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Check if user is part of a team
    // Use limit(1) instead of maybeSingle to avoid the error
    const { data: memberDataArray, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", userId)
      .limit(1);

    if (memberError) {
      console.error("Error fetching team membership:", memberError);
      return NextResponse.json(
        { error: memberError.message || "Failed to fetch team membership" },
        { status: 500 }
      );
    }

    const memberData = memberDataArray && memberDataArray.length > 0 ? memberDataArray[0] : null;

    if (!memberData || !memberData.team_id) {
      return NextResponse.json({
        success: true,
        team: null,
        member: null,
      });
    }

    // Fetch team details - use limit(1) instead of maybeSingle
    const { data: teamDataArray, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", memberData.team_id)
      .limit(1);

    if (teamError) {
      console.error("Error fetching team:", teamError);
      return NextResponse.json(
        { error: teamError.message || "Failed to fetch team" },
        { status: 500 }
      );
    }

    const teamData = teamDataArray && teamDataArray.length > 0 ? teamDataArray[0] : null;

    if (!teamData) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Fetch team members separately to avoid nested query issues
    const { data: membersData, error: membersError } = await supabase
      .from("team_members")
      .select("id, profile_id, role, joined_at")
      .eq("team_id", memberData.team_id);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      // Don't fail the request, just return team without members
      return NextResponse.json({
        success: true,
        team: {
          ...teamData,
          members: [],
        },
        member: memberData,
      });
    }

    // Fetch profiles for each member separately
    const membersWithProfiles = [];
    if (membersData && membersData.length > 0) {
      for (const member of membersData) {
        const { data: profileDataArray } = await supabase
          .from("profiles")
          .select("id, name, major, avatar_url")
          .eq("id", member.profile_id)
          .limit(1);
        
        const profileData = profileDataArray && profileDataArray.length > 0 ? profileDataArray[0] : null;

        membersWithProfiles.push({
          id: member.id,
          profile_id: member.profile_id,
          role: member.role,
          joined_at: member.joined_at,
          profile: profileData || {
            id: member.profile_id,
            name: "Unknown",
            major: "",
            avatar_url: null,
          },
        });
      }
    }

    // Combine team and members
    const teamWithMembers = {
      ...teamData,
      members: membersWithProfiles,
    };

    return NextResponse.json({
      success: true,
      team: teamWithMembers,
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

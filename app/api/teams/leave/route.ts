import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { teamId, userId } = await request.json();

    if (!teamId || !userId) {
      return NextResponse.json(
        { error: "Team ID and user ID are required" },
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

    // Get team member record
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("id, team_id")
      .eq("team_id", teamId)
      .eq("profile_id", userId)
      .maybeSingle();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "Team membership not found" },
        { status: 404 }
      );
    }

    // Check if this is the last member
    const { data: allMembers, error: countError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check team members" },
        { status: 500 }
      );
    }

    const isLastMember = allMembers && allMembers.length === 1;

    // Remove user from team
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberData.id);

    if (deleteError) {
      console.error("Error removing team member:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to leave team" },
        { status: 500 }
      );
    }

    // If last member, delete the team
    if (isLastMember) {
      const { error: teamDeleteError } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (teamDeleteError) {
        console.error("Error deleting team:", teamDeleteError);
        // Don't fail the request, just log the error
      }
    }

    // Update user status back to "looking"
    const { error: statusError } = await supabase
      .from("profiles")
      .update({ status: "looking" })
      .eq("id", userId);

    if (statusError) {
      console.error("Error updating user status:", statusError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

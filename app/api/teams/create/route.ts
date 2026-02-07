import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { teamName, teamDescription, userId } = await request.json();

    if (!teamName || !userId) {
      return NextResponse.json(
        { error: "Team name and user ID are required" },
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

    // Create team
    const { data: newTeam, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName.trim(),
        description: teamDescription?.trim() || null,
      })
      .select()
      .single();

    if (teamError || !newTeam) {
      console.error("Error creating team:", teamError);
      return NextResponse.json(
        { error: teamError?.message || "Failed to create team" },
        { status: 500 }
      );
    }

    // Add current user as member
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: newTeam.id,
        profile_id: userId,
        role: "member",
      })
      .select()
      .single();

    if (memberError || !memberData) {
      console.error("Error adding team member:", memberError);
      // Try to clean up the team if member insertion fails
      await supabase.from("teams").delete().eq("id", newTeam.id);
      return NextResponse.json(
        { error: memberError?.message || "Failed to add you to the team" },
        { status: 500 }
      );
    }

    // Update user status to "in_team"
    const { error: statusError } = await supabase
      .from("profiles")
      .update({ status: "in_team" })
      .eq("id", userId);

    if (statusError) {
      console.error("Error updating user status:", statusError);
      // Don't fail the request, but log the error
    }

    console.log("Team member created successfully:", memberData);

    return NextResponse.json({ 
      success: true, 
      team: newTeam,
      member: memberData 
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

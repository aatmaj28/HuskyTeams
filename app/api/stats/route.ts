import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use service role key to bypass RLS for public stats
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

    // Get count of all students who completed onboarding
    const { count: studentsCount, error: studentsError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true);

    if (studentsError) {
      console.error("Error fetching students count:", studentsError);
    }

    // Get count of all teams (unique team IDs)
    const { count: teamsCount, error: teamsError } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true });

    if (teamsError) {
      console.error("Error fetching teams count:", teamsError);
    }

    return NextResponse.json({
      success: true,
      studentsLooking: studentsCount || 0,
      teamsFormed: teamsCount || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

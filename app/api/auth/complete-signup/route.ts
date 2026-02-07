import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password, otp } = await request.json();

        if (!email || !password || !otp) {
            return NextResponse.json(
                { error: "Email, password, and OTP are required" },
                { status: 400 }
            );
        }

        // Use service role key to access database and admin API
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

        // Get stored OTP
        const { data: otpRecord, error: fetchError } = await supabase
            .from("otp_verifications")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .single();

        if (fetchError || !otpRecord) {
            return NextResponse.json(
                { error: "Invalid OTP" },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        const expiresAt = new Date(otpRecord.expires_at);
        if (new Date() > expiresAt) {
            // Delete expired OTP
            await supabase
                .from("otp_verifications")
                .delete()
                .eq("id", otpRecord.id);

            return NextResponse.json(
                { error: "OTP has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Check if already verified/used
        if (otpRecord.verified) {
            return NextResponse.json(
                { error: "OTP already used" },
                { status: 400 }
            );
        }

        // Mark OTP as verified
        await supabase
            .from("otp_verifications")
            .update({ verified: true })
            .eq("id", otpRecord.id);

        // Create user with admin API - email is already confirmed
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // This marks the email as confirmed!
        });

        if (createError) {
            console.error("Error creating user:", createError);

            // Check if user already exists
            if (createError.message?.includes("already been registered")) {
                return NextResponse.json(
                    { error: "An account with this email already exists. Please try logging in." },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: createError.message || "Failed to create account" },
                { status: 500 }
            );
        }

        // Clean up - delete the OTP record
        await supabase
            .from("otp_verifications")
            .delete()
            .eq("id", otpRecord.id);

        return NextResponse.json({
            success: true,
            message: "Account created successfully",
            user: { id: userData.user?.id, email: userData.user?.email },
        });
    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        // Use service role key to access database
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

        // Check if already verified
        if (otpRecord.verified) {
            return NextResponse.json(
                { error: "OTP already used" },
                { status: 400 }
            );
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from("otp_verifications")
            .update({ verified: true })
            .eq("id", otpRecord.id);

        if (updateError) {
            console.error("Error updating OTP:", updateError);
            return NextResponse.json(
                { error: "Failed to verify OTP" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

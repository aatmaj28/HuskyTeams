import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendOTPEmail } from "@/lib/nodemailer";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Validate Northeastern email
        if (!email.endsWith("@northeastern.edu")) {
            return NextResponse.json(
                { error: "Please use your @northeastern.edu email address" },
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

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete any existing OTPs for this email
        await supabase
            .from("otp_verifications")
            .delete()
            .eq("email", email);

        // Store new OTP
        const { error: insertError } = await supabase
            .from("otp_verifications")
            .insert({
                email,
                otp,
                expires_at: expiresAt.toISOString(),
                verified: false,
            });

        if (insertError) {
            console.error("Error storing OTP:", insertError);
            return NextResponse.json(
                { error: "Failed to generate OTP" },
                { status: 500 }
            );
        }

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);

        if (!emailSent) {
            return NextResponse.json(
                { error: "Failed to send OTP email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

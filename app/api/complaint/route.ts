import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const description = formData.get("description") as string;
        const email = formData.get("email") as string;
        const image = formData.get("image") as File | null;

        console.log("[EcoTrace Complaint] New complaint received:");
        console.log("  Email:", email || "not provided");
        console.log("  Description:", description);
        console.log("  Has image:", !!image, image?.name);

        // ── Email hook (Gmail SMTP — activate when SMTP_PASS env var is set) ──
        // Uncomment and configure with nodemailer when ready:
        //
        // const nodemailer = require("nodemailer");
        // const transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        // });
        // await transporter.sendMail({
        //   from: process.env.SMTP_USER,
        //   to: email,
        //   subject: "EcoTrace — Complaint Registered",
        //   text: `Your complaint has been registered.\n\nDescription: ${description}`,
        // });

        return NextResponse.json({
            success: true,
            message: "Complaint registered successfully",
        });
    } catch (error) {
        console.error("[EcoTrace Complaint] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to register complaint" },
            { status: 500 }
        );
    }
}

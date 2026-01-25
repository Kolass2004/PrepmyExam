import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json({ hasAcceptedTerms: false });
        }

        const data = userDoc.data();
        return NextResponse.json({ hasAcceptedTerms: !!data?.hasAcceptedTerms });

    } catch (error) {
        console.error("Error fetching terms status:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid } = body;

        if (!uid) {
            return NextResponse.json({ error: "Missing uid" }, { status: 400 });
        }

        await adminDb.collection("users").doc(uid).set({
            hasAcceptedTerms: true,
            termsAcceptedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating terms status:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

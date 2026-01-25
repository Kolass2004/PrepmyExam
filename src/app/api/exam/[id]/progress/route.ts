import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { userId, answers, currentQuestionIndex, timestamp } = await request.json();

        if (!userId || !id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Save to users/{userId}/progress/{examId} to match client-side read
        await adminDb.collection("users").doc(userId).collection("progress").doc(id).set({
            userId,
            examId: id,
            answers,
            currentQuestionIndex,
            updatedAt: timestamp || new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const uid = request.nextUrl.searchParams.get("uid");

    if (!uid) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    try {
        const doc = await adminDb.collection("users").doc(uid).collection("progress").doc(id).get();
        if (!doc.exists) return NextResponse.json({ progress: null });

        return NextResponse.json({ progress: doc.data() });
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId || !id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        await adminDb.collection("users").doc(userId).collection("progress").doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

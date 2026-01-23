import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { userId, answers, currentQuestionIndex, timestamp } = await request.json();

        if (!userId || !id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        await adminDb.collection("progress").doc(`${userId}_${id}`).set({
            userId,
            examId: id,
            answers,
            currentQuestionIndex,
            updatedAt: timestamp || new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const uid = request.nextUrl.searchParams.get("uid");

    if (!uid) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    try {
        const doc = await adminDb.collection("progress").doc(`${uid}_${id}`).get();
        if (!doc.exists) return NextResponse.json({ progress: null });

        return NextResponse.json({ progress: doc.data() });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId || !id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        await adminDb.collection("progress").doc(`${userId}_${id}`).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

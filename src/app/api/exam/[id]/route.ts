import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    try {
        const doc = await adminDb.collection("exams").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: doc.id,
            ...doc.data()
        });
    } catch (error) {
        console.error("Error fetching exam:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { title } = await request.json();

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        await adminDb.collection("exams").doc(id).update({
            title
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating exam:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

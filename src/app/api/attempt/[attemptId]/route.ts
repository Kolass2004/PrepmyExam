import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
    const { attemptId } = await params;

    try {
        const attemptDoc = await adminDb.collection("attempts").doc(attemptId).get();
        if (!attemptDoc.exists) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

        const attempt = { id: attemptDoc.id, ...attemptDoc.data() } as any;

        // Fetch Exam
        const examDoc = await adminDb.collection("exams").doc(attempt.examId).get();
        if (!examDoc.exists) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

        const exam = { id: examDoc.id, ...examDoc.data() };

        return NextResponse.json({ attempt, exam });
    } catch (error) {
        console.error("Error fetching attempt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

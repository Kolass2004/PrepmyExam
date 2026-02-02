import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
    const { attemptId } = await params;

    try {
        const attemptDoc = await adminDb.collection("attempts").doc(attemptId).get();
        if (!attemptDoc.exists) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

        const attempt = { id: attemptDoc.id, ...attemptDoc.data() } as any;

        // Fetch Exam
        // Fetch Exam
        let examDoc = await adminDb.collection("exams").doc(attempt.examId).get();
        let examData = examDoc.exists ? examDoc.data() : null;

        // If not found in main exams, check user's daily tasks
        if (!examData) {
            console.log(`Exam ${attempt.examId} not found in main collection, checking daily tasks for user ${attempt.userId}`);
            const dailyTaskDoc = await adminDb
                .collection("users")
                .doc(attempt.userId)
                .collection("daily_tasks")
                .doc(attempt.examId)
                .get();

            if (dailyTaskDoc.exists) {
                examData = dailyTaskDoc.data();
            }
        }

        if (!examData) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

        const exam = { id: attempt.examId, ...examData };

        return NextResponse.json({ attempt, exam });
    } catch (error) {
        console.error("Error fetching attempt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

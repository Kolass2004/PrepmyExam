import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
    try {
        const { examId, userId, answers, score, skippedCount, completedAt } = await request.json();

        if (!examId || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Save attempt
        const attemptRef = await adminDb.collection("attempts").add({
            examId,
            userId,
            answers,
            score,
            skippedCount: skippedCount || 0,
            completedAt,
            status: "completed"
        });

        // Update user stats (optional, can be done via cloud function or here)
        // For now, let's just save the attempt. 
        // Ideally we aggregate scores in the user doc for the dashboard "Overall Score".

        // Simple aggregation: get all attempts and avg (expensive) or increment.
        // Let's just store the attempt. The dashboard can calculate or we can store a running avg.

        // Delete progress (cleanup)
        await adminDb.collection("users").doc(userId).collection("progress").doc(examId).delete();

        return NextResponse.json({ success: true, attemptId: attemptRef.id });
    } catch (error) {
        console.error("Submit error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

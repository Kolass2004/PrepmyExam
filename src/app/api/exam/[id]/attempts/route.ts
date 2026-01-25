import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!id || !uid) {
        return NextResponse.json({ error: "Exam ID and User ID required" }, { status: 400 });
    }

    try {
        // Query attempts without ordering to avoid missing index issues
        const attemptsSnapshot = await adminDb
            .collection("attempts")
            .where("examId", "==", id)
            .where("userId", "==", uid)
            .get();

        // Fetch Progress (Paused attempt) from correct path
        const progressDoc = await adminDb.collection("users").doc(uid).collection("progress").doc(id).get();
        let pausedAttempt: any = null;

        if (progressDoc.exists) {
            const progressData = progressDoc.data();
            pausedAttempt = {
                id: `progress_${uid}_${id}`, // Unique ID for list
                score: null,
                completedAt: progressData?.updatedAt,
                status: "paused",
                currentQuestionIndex: progressData?.currentQuestionIndex,
                skippedCount: 0 // Default for types
            };
        }

        const attempts: any[] = attemptsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort in memory (descending date)
        attempts.sort((a, b) => {
            const dateA = new Date(a.completedAt).getTime();
            const dateB = new Date(b.completedAt).getTime();
            return dateB - dateA;
        });

        if (pausedAttempt) {
            attempts.unshift(pausedAttempt);
        }

        return NextResponse.json({ attempts });
    } catch (error) {
        console.error("Error fetching attempts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

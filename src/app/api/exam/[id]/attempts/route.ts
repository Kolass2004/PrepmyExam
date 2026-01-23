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
        const attemptsSnapshot = await adminDb
            .collection("attempts")
            .where("examId", "==", id)
            .where("userId", "==", uid)
            .orderBy("completedAt", "desc")
            .get();
        // Fetch Progress (Paused attempt)
        const progressDoc = await adminDb.collection("progress").doc(`${uid}_${id}`).get();
        let pausedAttempt = null;

        if (progressDoc.exists) {
            const progressData = progressDoc.data();
            pausedAttempt = {
                id: `progress_${uid}_${id}`, // Unique ID for list
                score: null,
                completedAt: progressData?.updatedAt,
                status: "paused",
                currentQuestionIndex: progressData?.currentQuestionIndex
            };
        }

        const attempts = attemptsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (pausedAttempt) {
            attempts.unshift(pausedAttempt);
        }

        return NextResponse.json({ attempts });
    } catch (error) {
        console.error("Error fetching attempts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

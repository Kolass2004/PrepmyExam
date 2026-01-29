import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { QuestionSet } from "@/lib/types";

// Public route to list question sets for an exam
export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;

    try {
        const snapshot = await adminDb.collection("question_sets")
            .where("targetExamId", "==", examId)
            .orderBy("createdAt", "desc")
            .get();

        const sets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Remove sensitive data or answers if necessary, but "questions" usually needed for count
        })) as QuestionSet[];

        return NextResponse.json({ sets });
    } catch (error) {
        console.error("Error fetching question sets", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        // 1. Fetch Progress (Most recently updated first)
        const progressSnapshot = await adminDb
            .collection("users")
            .doc(uid)
            .collection("progress")
            .orderBy("updatedAt", "desc")
            .limit(20)
            .get();

        if (progressSnapshot.empty) {
            return NextResponse.json({ recents: [] });
        }

        // 2. Resolve Exam Details
        const recentExams = await Promise.all(progressSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const examId = doc.id;

            // Try Exams Collection (Personal Uploads)
            let examDoc = await adminDb.collection("exams").doc(examId).get();
            let type = 'personal';
            let title = "Untitled Exam";
            let questionCount = 0;

            if (examDoc.exists) {
                const examData = examDoc.data();
                title = examData?.title || "Untitled Exam";
                questionCount = examData?.questions?.length || 0;
            } else {
                // Try Question Sets Collection (Question Banks)
                examDoc = await adminDb.collection("question_sets").doc(examId).get();
                if (examDoc.exists) {
                    type = 'question_bank';
                    const setData = examDoc.data();
                    title = setData?.title || "Untitled Set";
                    questionCount = setData?.questions?.length || 0;
                    // We need targetExamId to construct the URL
                    // Assume it is stored in the set document
                    if (setData?.targetExamId) {
                        (title as any) = { text: title, targetExamId: setData.targetExamId }; // Hacky way to pass it? No lets add field
                    }
                } else {
                    // Unknown or Deleted Exam
                    return null;
                }
            }

            const dataContent = examDoc.exists ? examDoc.data() : {};
            let targetExamId = null;
            if (type === 'question_bank') {
                targetExamId = dataContent?.targetExamId || null;
            }

            return {
                id: examId,
                title: typeof title === 'object' ? (title as any).text : title,
                questionCount,
                type,
                targetExamId,
                progress: {
                    currentQuestionIndex: data.currentQuestionIndex || 0,
                    answeredCount: Object.keys(data.answers || {}).length,
                    timestamp: data.updatedAt
                }
            };
        }));

        // Filter out nulls (deleted exams)
        return NextResponse.json({ recents: recentExams.filter(e => e !== null) });
    } catch (error) {
        console.error("Error fetching recents:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;

    try {
        const doc = await adminDb.collection("target_exams").doc(examId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching exam", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { TargetExam } from "@/lib/types";

// Public route to list exams
export async function GET(req: NextRequest) {
    try {
        const snapshot = await adminDb.collection("target_exams").orderBy("createdAt", "desc").get();
        const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TargetExam[];
        return NextResponse.json({ exams });
    } catch (error) {
        console.error("Error fetching exams", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

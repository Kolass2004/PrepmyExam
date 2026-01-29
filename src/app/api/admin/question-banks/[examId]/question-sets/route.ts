import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { QuestionSet } from "@/lib/types";

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    try {
        const token = authHeader.split("Bearer ")[1];
        return await adminAuth.verifyIdToken(token);
    } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { examId } = await params;

    try {
        const snapshot = await adminDb.collection("question_sets")
            .where("targetExamId", "==", examId)
            .orderBy("createdAt", "desc")
            .get();

        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuestionSet[];
        return NextResponse.json({ sets });
    } catch (error) {
        console.error("Error fetching question sets", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { examId } = await params;

    try {
        const body = await req.json();
        const { title, questions } = body;

        if (!title || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const newSet: Omit<QuestionSet, "id"> = {
            targetExamId: examId,
            title,
            questions, // Assumes questions are already in correct format or raw JSON
            createdAt: Date.now(),
        };

        const docRef = await adminDb.collection("question_sets").add(newSet);
        return NextResponse.json({ id: docRef.id, ...newSet });
    } catch (error) {
        console.error("Error creating question set", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

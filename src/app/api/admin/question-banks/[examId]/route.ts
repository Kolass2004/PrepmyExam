import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { examId } = await params;

    try {
        const body = await req.json();
        const { title, description, latestNews } = body;

        await adminDb.collection("target_exams").doc(examId).update({
            ...(title && { title }),
            ...(description && { description }),
            ...(latestNews !== undefined && { latestNews }),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating exam", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { examId } = await params;

    try {
        // Recursively delete subcollections or associated sets if we were strict,
        // but for now just delete the exam document. 
        // NOTE: In Firestore deleting a document does not delete subcollections. 
        // If we link question sets by ID field, they will be orphaned. 
        // Ideally we query and delete them first.

        const setsSnapshot = await adminDb.collection("question_sets").where("targetExamId", "==", examId).get();
        const batch = adminDb.batch();

        setsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        batch.delete(adminDb.collection("target_exams").doc(examId));
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting exam", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

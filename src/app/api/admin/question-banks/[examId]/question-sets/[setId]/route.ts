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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ examId: string, setId: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { setId } = await params;

    try {
        await adminDb.collection("question_sets").doc(setId).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting question set", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

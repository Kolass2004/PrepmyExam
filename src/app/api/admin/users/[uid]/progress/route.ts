import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { adminAuth } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    try {
        const token = authHeader.split("Bearer ")[1];
        return await adminAuth.verifyIdToken(token);
    } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { uid } = await params;

    try {
        const snapshot = await adminDb.collection("users").doc(uid).collection("progress").get();
        const progress = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return NextResponse.json({ progress });
    } catch (error) {
        console.error("Error fetching user progress", error);
        return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }
}

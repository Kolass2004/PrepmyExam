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

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const doc = await adminDb.collection("system").doc("features").get();
        return NextResponse.json({ features: doc.data() || {} });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { feature, value } = await req.json();
        await adminDb.collection("system").doc("features").set({
            [feature]: value
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

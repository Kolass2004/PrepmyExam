import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { TargetExam } from "@/lib/types";

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
        const snapshot = await adminDb.collection("target_exams").orderBy("createdAt", "desc").get();
        const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TargetExam[];
        return NextResponse.json({ exams });
    } catch (error) {
        console.error("Error fetching exams", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { title, description, latestNews } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newExam: Omit<TargetExam, "id"> = {
            title,
            description,
            latestNews: latestNews || "",
            createdAt: Date.now(),
        };

        const docRef = await adminDb.collection("target_exams").add(newExam);

        return NextResponse.json({ id: docRef.id, ...newExam });
    } catch (error) {
        console.error("Error creating exam", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

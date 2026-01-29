import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string, setId: string }> }) {
    const { setId } = await params;

    try {
        const doc = await adminDb.collection("question_sets").doc(setId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Set not found" }, { status: 404 });
        }
        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching question set", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

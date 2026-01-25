import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "Missing uid" }, { status: 400 });
        }

        // Delete user's attempts
        const attemptsSnapshot = await adminDb.collection("attempts").where("userId", "==", uid).get();

        if (attemptsSnapshot.empty) {
            return NextResponse.json({ success: true, message: "No history to clear" });
        }

        const batch = adminDb.batch();
        attemptsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return NextResponse.json({ success: true, message: "History cleared successfully" });
    } catch (error) {
        console.error("Error clearing history:", error);
        return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
    }
}

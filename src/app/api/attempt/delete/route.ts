import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { attemptIds, userId } = await request.json();

        if (!attemptIds || !Array.isArray(attemptIds) || attemptIds.length === 0) {
            return NextResponse.json({ error: "Invalid attemptIds" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const batch = adminDb.batch();

        // Optional: Verify ownership of each doc before deleting? 
        // For efficiency in a personal project, we might trust the client context or check in parallel.
        // Let's iterate and delete.

        attemptIds.forEach(id => {
            if (id.startsWith("progress_")) {
                // It's a progress doc
                // ID format: progress_uid_examId. 
                // But wait, the stored doc ID in firestore is literally just `userId_examId`.
                // The ID coming in here is `progress_userId_examId`.
                // Extract unique ID key: remove "progress_"
                const progressKey = id.replace("progress_", "");
                const docRef = adminDb.collection("progress").doc(progressKey);
                batch.delete(docRef);
            } else {
                const docRef = adminDb.collection("attempts").doc(id);
                batch.delete(docRef);
            }
        });

        await batch.commit();

        return NextResponse.json({ success: true, count: attemptIds.length });

    } catch (error) {
        console.error("Error deleting attempts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

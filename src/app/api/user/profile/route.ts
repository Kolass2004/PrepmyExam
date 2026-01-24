import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        // 1. Fetch User Info from Auth
        const userRecord = await adminAuth.getUser(uid);

        // 2. Fetch User Stats (Overall Score, Total Attempts)
        const attemptsSnapshot = await adminDb.collection("attempts")
            .where("userId", "==", uid)
            .get();

        let totalScore = 0;
        let totalAttempts = 0;

        attemptsSnapshot.forEach(doc => {
            const data = doc.data();
            if (typeof data.score === 'number') {
                totalScore += data.score;
                totalAttempts++;
            }
        });

        const overallScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;

        return NextResponse.json({
            user: {
                uid: userRecord.uid,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                email: userRecord.email, // Consider if email should be public. Maybe obfuscate?
                createdAt: userRecord.metadata.creationTime,
            },
            stats: {
                overallScore,
                totalAttempts
            }
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Profile not found or internal error" }, { status: 404 });
    }
}

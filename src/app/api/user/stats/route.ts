import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const attemptsSnapshot = await adminDb.collection("attempts")
            .where("userId", "==", uid)
            .get();

        if (attemptsSnapshot.empty) {
            return NextResponse.json({ overallScore: 0, totalAttempts: 0, totalQuestions: 0 });
        }

        let totalScore = 0;
        let totalAttempts = 0;

        attemptsSnapshot.forEach(doc => {
            const data = doc.data();
            // Ensure score exists and is a number
            if (typeof data.score === 'number') {
                totalScore += data.score;
                totalAttempts++;
            }
        });

        const overallScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;

        return NextResponse.json({
            overallScore,
            totalAttempts
        });

    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

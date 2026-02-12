
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UserGoal, DailyTaskProfile } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "Missing UID" }, { status: 400 });
        }

        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        const goal = userData?.goal as UserGoal | undefined;

        if (!goal || !goal.dailyTaskProfile) {
            return NextResponse.json({ error: "No daily task profile found" }, { status: 400 });
        }

        const profile = goal.dailyTaskProfile;

        // Verify eligibility
        if (profile.status !== 'deprecated') {
            return NextResponse.json({ error: "Account is not deprecated" }, { status: 400 });
        }

        const appealsUsed = profile.appealsUsed || 0;
        if (appealsUsed >= 2) {
            return NextResponse.json({ error: "Max appeals used" }, { status: 403 });
        }

        // Apply Appeal
        const newAppealsUsed = appealsUsed + 1;
        const remaining = 2 - newAppealsUsed;

        await userRef.update({
            "goal.dailyTaskProfile.status": 'active',
            "goal.dailyTaskProfile.consecutiveMissed": 0,
            "goal.dailyTaskProfile.appealsUsed": newAppealsUsed
        });

        return NextResponse.json({
            success: true,
            message: `Appeal successful. You have ${remaining} appeals left.`,
            remaining
        });

    } catch (error: any) {
        console.error("Appeal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

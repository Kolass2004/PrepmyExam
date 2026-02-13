
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UserGoal, DailyTaskProfile } from "@/lib/types";
import { getISTDateString, toISTDateString } from "@/lib/dates";

export const maxDuration = 60;
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

// Vercel Crons use GET requests
export async function GET(request: NextRequest) {
    return POST(request);
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const targetUid = searchParams.get('uid');

        console.log(`CRON: Checking Daily Task Deprecation... ${targetUid ? `(Target: ${targetUid})` : ''}`);

        let usersSnapshot;
        if (targetUid) {
            const doc = await adminDb.collection("users").doc(targetUid).get();
            usersSnapshot = { docs: doc.exists ? [doc] : [] };
        } else {
            usersSnapshot = await adminDb.collection("users").get();
        }

        let checkedCount = 0;
        let deprecatedCount = 0;
        let warningCount = 0;

        const batch = adminDb.batch();
        let batchCount = 0;

        // Use IST date for all comparisons
        const todayIST = getISTDateString();

        for (const doc of usersSnapshot.docs) {
            const uid = doc.id;
            const userData = doc.data();
            const goal = userData?.goal as UserGoal | undefined;

            // Skip if no goal or already deprecated
            if (!goal || !goal.dailyTaskProfile || goal.dailyTaskProfile.status === 'deprecated') {
                continue;
            }

            const profile = goal.dailyTaskProfile;

            // Convert timestamps to IST dates
            const lastGenDateIST = profile.lastGeneratedAt ? toISTDateString(profile.lastGeneratedAt) : null;
            const lastAttDateIST = profile.lastAttemptedAt ? toISTDateString(profile.lastAttemptedAt) : null;

            if (lastGenDateIST === todayIST) {
                // Task existed for today (IST). Did they attempt it?
                if (lastAttDateIST !== todayIST) {
                    // MISS!
                    checkedCount++;
                    const newMissed = (profile.consecutiveMissed || 0) + 1;

                    const updates: any = {
                        "goal.dailyTaskProfile.consecutiveMissed": newMissed
                    };

                    if (newMissed >= 2) {
                        updates["goal.dailyTaskProfile.status"] = 'deprecated';
                        deprecatedCount++;
                        console.log(`User ${uid} deprecated (Missed: ${newMissed})`);
                    } else {
                        warningCount++;
                        console.log(`User ${uid} missed task (Streak: ${newMissed})`);
                    }

                    batch.update(doc.ref, updates);
                    batchCount++;
                } else {
                    // Attempted! Reset streak if > 0
                    if (profile.consecutiveMissed > 0) {
                        batch.update(doc.ref, { "goal.dailyTaskProfile.consecutiveMissed": 0 });
                        batchCount++;
                    }
                }
            }

            // Limit batch size (Firestore limit 500)
            if (batchCount >= 400) {
                await batch.commit();
                // For small user bases, one batch is sufficient.
                // For larger user bases, would need chunking with new batch instances.
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            summary: { checked: checkedCount, deprecated: deprecatedCount, warnings: warningCount }
        });

    } catch (error: any) {
        console.error("CRON Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

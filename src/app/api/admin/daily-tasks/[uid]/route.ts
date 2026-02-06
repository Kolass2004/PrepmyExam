import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UserGoal, DailyTaskProfile } from "@/lib/types";

export const dynamic = 'force-dynamic';

// GET /api/admin/daily-tasks/[uid] - Get specific user's daily task details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ uid: string }> }
) {
    try {
        const params = await props.params;
        const { uid } = params;

        if (!uid || typeof uid !== 'string') {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const userDocPromise = adminDb.collection("users").doc(uid).get();
        // Dynamic import to avoid circular dep issues if any, or just consistent style
        const { adminAuth } = await import("@/lib/firebase/admin");
        const userAuthPromise = adminAuth.getUser(uid).catch(() => null);

        const [userDoc, userAuth] = await Promise.all([userDocPromise, userAuthPromise]);

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found in database" }, { status: 404 });
        }

        const userData = userDoc.data();
        const goal = userData?.goal as UserGoal | undefined;

        if (!goal) {
            return NextResponse.json({ error: "User has no goal set" }, { status: 400 });
        }

        // Get all daily tasks for this user
        const tasksSnapshot = await adminDb
            .collection("users")
            .doc(uid)
            .collection("daily_tasks")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const tasks = tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                weekNumber: data.weekNumber,
                weekTitle: data.weekTitle,
                questionCount: data.questionCount || data.questions?.length || 0,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                status: data.status,
                score: data.score || null,
                attemptedAt: data.attemptedAt || null,
            };
        });

        return NextResponse.json({
            user: {
                uid: userDoc.id,
                email: userAuth?.email || userData?.email || "N/A",
                displayName: userAuth?.displayName || userData?.displayName || userAuth?.email?.split("@")[0] || "Unknown",
            },
            goal: {
                exam: goal.exam,
                examDate: goal.examDate,
                createdAt: goal.createdAt,
            },
            profile: goal.dailyTaskProfile || null,
            tasks
        });

    } catch (error: any) {
        console.error("Admin Daily Tasks [uid] GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/daily-tasks/[uid] - Admin actions on user profile
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ uid: string }> }
) {
    try {
        const params = await props.params;
        const { uid } = params;

        if (!uid || typeof uid !== 'string') {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const body = await request.json();
        const { action } = body;

        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        const goal = userData?.goal as UserGoal | undefined;

        if (!goal) {
            return NextResponse.json({ error: "User has no goal set" }, { status: 400 });
        }

        let updateData: any = {};
        let message = "";

        switch (action) {
            case "reset_profile":
                // Reset missed count and activate
                updateData = {
                    "goal.dailyTaskProfile.status": "active",
                    "goal.dailyTaskProfile.consecutiveMissed": 0,
                };
                message = "Profile reset to active with 0 missed tasks";
                break;

            case "reset_appeals":
                // Reset appeals used to 0
                updateData = {
                    "goal.dailyTaskProfile.appealsUsed": 0,
                };
                message = "Appeals reset to 0";
                break;

            case "deprecate":
                // Force deprecate
                updateData = {
                    "goal.dailyTaskProfile.status": "deprecated",
                };
                message = "Profile deprecated";
                break;

            case "activate":
                // Force activate
                updateData = {
                    "goal.dailyTaskProfile.status": "active",
                    "goal.dailyTaskProfile.consecutiveMissed": 0,
                };
                message = "Profile activated";
                break;

            case "full_reset":
                // Complete reset
                updateData = {
                    "goal.dailyTaskProfile.status": "active",
                    "goal.dailyTaskProfile.consecutiveMissed": 0,
                    "goal.dailyTaskProfile.appealsUsed": 0,
                };
                message = "Full profile reset (status, missed, appeals)";
                break;

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await userRef.update(updateData);

        return NextResponse.json({
            success: true,
            message,
            action
        });

    } catch (error: any) {
        console.error("Admin Daily Tasks [uid] PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/daily-tasks/[uid] - Delete all daily tasks for user
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ uid: string }> }
) {
    try {
        const params = await props.params;
        const { uid } = params;

        if (!uid || typeof uid !== 'string') {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        // Get all daily tasks
        const tasksSnapshot = await adminDb
            .collection("users")
            .doc(uid)
            .collection("daily_tasks")
            .get();

        // Delete in batches
        const batch = adminDb.batch();
        tasksSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Reset profile
        await adminDb.collection("users").doc(uid).update({
            "goal.dailyTaskProfile.lastGeneratedAt": null,
            "goal.dailyTaskProfile.lastAttemptedAt": null,
        });

        return NextResponse.json({
            success: true,
            message: `Deleted ${tasksSnapshot.size} daily tasks`,
            deletedCount: tasksSnapshot.size
        });

    } catch (error: any) {
        console.error("Admin Daily Tasks [uid] DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

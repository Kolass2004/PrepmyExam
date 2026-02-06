
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { adminAuth } = await import("@/lib/firebase/admin");

        // 1. Get all users from Firestore
        const snapshot = await adminDb.collection("users").get();
        let zombieCount = 0;
        const potentialZombies = [];

        // 2. Identify Potential Zombies (Skeletal data)
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const uid = doc.id;
            // Strict check: if no email AND no displayName, suspect zombie
            if (!data.email && !data.displayName) {
                potentialZombies.push(uid);
            }
        }

        // 3. Verify with Auth and Delete
        for (const uid of potentialZombies) {
            try {
                await adminAuth.getUser(uid);
                // Exists in Auth -> Keep it (maybe just missing profile info)
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    // Confirmed Zombie -> Delete

                    // Delete daily_tasks subcollection
                    const tasksSnapshot = await adminDb.collection("users").doc(uid).collection("daily_tasks").get();
                    if (!tasksSnapshot.empty) {
                        const batch = adminDb.batch();
                        tasksSnapshot.docs.forEach(t => batch.delete(t.ref));
                        await batch.commit();
                    }

                    // Delete User Doc
                    await adminDb.collection("users").doc(uid).delete();
                    zombieCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup complete. Deleted ${zombieCount} zombie users.`,
            deletedCount: zombieCount
        });

    } catch (error: any) {
        console.error("Cleanup API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

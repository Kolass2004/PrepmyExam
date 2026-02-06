
import dotenv from 'dotenv';
dotenv.config();

import { adminDb, adminAuth } from "@/lib/firebase/admin";

async function deleteZombieUsers() {
    try {
        console.log("Starting zombie user cleanup...");
        const snapshot = await adminDb.collection("users").get();
        console.log(`Found ${snapshot.size} total users in Firestore.`);

        let zombieCount = 0;
        const potentialZombies = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const uid = doc.id;

            // Check if Firestore data is skeletal
            if (!data.email && !data.displayName) {
                potentialZombies.push(uid);
            }
        }

        console.log(`Checking ${potentialZombies.length} users with missing Firestore details against Auth...`);

        if (potentialZombies.length > 0) {
            // Check Auth for these users
            // Max 100 per batch for getUsers, but we iterate for simplicity if list is small
            for (const uid of potentialZombies) {
                try {
                    await adminAuth.getUser(uid);
                    // If successful, user exists in Auth -> Not a zombie (just missing profile)
                    // console.log(`User ${uid} exists in Auth. Keeping.`);
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        console.log(`User ${uid} NOT found in Auth. Deleting zombie record...`);

                        // Delete subcollections first (daily_tasks)
                        const tasksSnapshot = await adminDb.collection("users").doc(uid).collection("daily_tasks").get();
                        if (!tasksSnapshot.empty) {
                            const batch = adminDb.batch();
                            tasksSnapshot.docs.forEach(t => batch.delete(t.ref));
                            await batch.commit();
                            console.log(`  - Deleted ${tasksSnapshot.size} daily tasks.`);
                        }

                        // Delete user doc
                        await adminDb.collection("users").doc(uid).delete();
                        console.log(`  - Deleted Firestore document.`);
                        zombieCount++;
                    } else {
                        console.error(`Error checking user ${uid}:`, e);
                    }
                }
            }
        }

        console.log(`Cleanup complete. Deleted ${zombieCount} zombie users.`);
        process.exit(0);

    } catch (error) {
        console.error("Cleanup Error:", error);
        process.exit(1);
    }
}

deleteZombieUsers();

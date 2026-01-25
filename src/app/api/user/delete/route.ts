import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
// import { getStorage } from "firebase-admin/storage";
// import { getDatabase } from "firebase-admin/database";

export async function DELETE(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "Missing uid" }, { status: 400 });
        }

        console.log(`Starting account deletion for user: ${uid}`);

        // --- 1. Firestore Deletion (with Batching) ---

        // Helper to delete a query in batches
        async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value?: unknown) => void) {
            const snapshot = await query.get();

            const batchSize = snapshot.size;
            if (batchSize === 0) {
                // When there are no documents left, we are done
                resolve();
                return;
            }

            const batch = adminDb.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            process.nextTick(() => {
                deleteQueryBatch(query, resolve);
            });
        }

        async function recursiveDelete(collectionName: string, field: string) {
            const collectionRef = adminDb.collection(collectionName);
            const query = collectionRef.where(field, '==', uid).limit(500);
            return new Promise((resolve, reject) => {
                deleteQueryBatch(query, resolve).catch(reject);
            });
        }

        // Delete 'attempts'
        await recursiveDelete('attempts', 'userId');

        // Delete 'exams'
        await recursiveDelete('exams', 'userId');

        // Delete user profile document
        await adminDb.collection('users').doc(uid).delete();


        // --- 2. Firebase Storage Deletion (Placeholder) ---
        // If you were using Storage, you would delete the user's files here.
        /*
        try {
             const bucket = getStorage().bucket();
             await bucket.deleteFiles({
                 prefix: `users/${uid}/`
             });
        } catch (error) {
             console.log("No storage files found or error deleting:", error);
        }
        */

        // --- 3. Realtime Database Deletion (Placeholder) ---
        // If you were using RTDB, you would wipe the user's node here.
        /*
        try {
             const db = getDatabase();
             await db.ref(`users/${uid}`).remove();
        } catch (error) {
             console.log("Error deleting RTDB node:", error);
        }
        */

        // --- 4. Authentication Deletion ---
        await adminAuth.deleteUser(uid);

        console.log(`Successfully deleted account for user: ${uid}`);
        return NextResponse.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}

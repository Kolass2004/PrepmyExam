
import { adminDb, adminAuth } from "@/lib/firebase/admin";

async function inspectFirstUser() {
    try {
        console.log("Fetching users from Firestore...");
        const snapshot = await adminDb.collection("users").limit(1).get();

        if (snapshot.empty) {
            console.log("No users found in Firestore.");
            return;
        }

        const doc = snapshot.docs[0];
        console.log("User ID:", doc.id);
        console.log("Firestore Data:", JSON.stringify(doc.data(), null, 2));

        try {
            console.log("Fetching Auth data for UID:", doc.id);
            const userRecord = await adminAuth.getUser(doc.id);
            console.log("Auth Data:", JSON.stringify(userRecord.toJSON(), null, 2));
        } catch (e) {
            console.log("User not found in Auth:", e);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

inspectFirstUser();

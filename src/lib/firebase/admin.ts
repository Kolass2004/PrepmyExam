import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables.");
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const adminDb = getFirestore();

export { adminDb };

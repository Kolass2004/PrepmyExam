import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables.");
}

let serviceAccount;

try {
    serviceAccount = JSON.parse(serviceAccountKey);
} catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    throw new Error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
}

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const adminDb = getFirestore();

export { adminDb };

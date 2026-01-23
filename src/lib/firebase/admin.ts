import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : require("../../../rexon-bank-exam-preparation-firebase-adminsdk-fbsvc-3c32168962.json");

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const adminDb = getFirestore();

export { adminDb };

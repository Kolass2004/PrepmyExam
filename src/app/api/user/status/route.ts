import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const token = authHeader.split("Bearer ")[1];
    let uid;
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
    } catch (e) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    try {
        // Check firestore for disabled flag
        const doc = await adminDb.collection("users").doc(uid).get();
        const data = doc.data();

        // Also check Auth status if needed, but Firestore is what we update in admin panel
        // (The Auth `disabled` prop is checked by Firebase Auth middleware/client SDK on login, 
        // but active sessions might need this check).

        const isDisabled = data?.disabled === true || data?.status === "disabled";

        return NextResponse.json({ disabled: isDisabled });
    } catch (error) {
        console.error("Error fetching status", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

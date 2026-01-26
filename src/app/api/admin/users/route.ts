import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

// Helper to verify admin
async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken.firebase.sign_in_provider !== "password") {
            // Optional strict check
        }
        return decodedToken;
    } catch (error) {
        console.error("Token verification failed", error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const listUsersResult = await adminAuth.listUsers(1000);
        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            disabled: user.disabled,
            metadata: user.metadata,
            providerData: user.providerData
        }));
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error listing users", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { uid, disabled, displayName, email } = body;

        if (!uid) {
            return NextResponse.json({ error: "UID required" }, { status: 400 });
        }

        const updateData: any = {};
        if (typeof disabled !== 'undefined') updateData.disabled = disabled;
        if (displayName) updateData.displayName = displayName;
        if (email) updateData.email = email;

        const updatedUser = await adminAuth.updateUser(uid, updateData);

        // Also update Firestore to enforce UI lock immediately
        if (typeof disabled !== 'undefined') {
            // Dynamically import to avoid edge runtime issues if any (though we are in nodejs env here)
            const { adminDb } = await import("@/lib/firebase/admin");
            await adminDb.collection("users").doc(uid).set({
                disabled: disabled,
                status: disabled ? "disabled" : "active",
                updatedAt: new Date()
            }, { merge: true });
        }

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("Error updating user", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

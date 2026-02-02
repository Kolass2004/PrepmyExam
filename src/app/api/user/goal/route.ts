
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { uid, goal } = await request.json();

        if (!uid || !goal) {
            return NextResponse.json({ error: "Missing uid or goal data" }, { status: 400 });
        }

        // Save goal to user's document or a subcollection
        // For simplicity, let's store it in a root 'goals' collection keyed by uid, 
        // OR inside the user document in 'users' collection.
        // Let's go with 'users/{uid}' merging the goal field for easier access in profile.

        await adminDb.collection("users").doc(uid).set({
            goal: {
                ...goal,
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving user goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const data = userDoc.data();
        return NextResponse.json({ goal: data?.goal || null });
    } catch (error) {
        console.error("Error fetching user goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        await adminDb.collection("users").doc(uid).set({
            goal: null
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

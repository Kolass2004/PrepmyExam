
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const tasksSnapshot = await adminDb.collection("users").doc(uid).collection("daily_tasks")
            .orderBy("createdAt", "desc")
            .get();

        const tasks = tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            const now = new Date();
            const expiresAt = new Date(data.expiresAt);
            const isExpired = now > expiresAt;

            return {
                ...data,
                id: doc.id,
                isExpired,
                status: isExpired ? 'expired' : 'active'
            };
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error("Error fetching daily tasks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    try {
        const token = authHeader.split("Bearer ")[1];
        return await adminAuth.verifyIdToken(token);
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // 1. Get User Count (approximate or exact list length)
        // listUsers() returns batches, but for stats we might just fetch the first batch meta or iterate if needed.
        // For distinct count, listing all is expensive if many users, but for now it's fine.
        let userCount = 0;
        let nextPageToken;
        do {
            const result = await adminAuth.listUsers(1000, nextPageToken);
            userCount += result.users.length;
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        // 2. Get Total Exams Started (using collectionGroup query)
        // Requires a composite index maybe? collectionGroup counts are efficient.
        const examsSnapshot = await adminDb.collectionGroup("progress").count().get();
        const activeExamsCount = examsSnapshot.data().count;

        return NextResponse.json({
            totalUsers: userCount,
            activeExams: activeExamsCount,
            systemStatus: "Operational" // Placeholder logic
        });
    } catch (error) {
        console.error("Error fetching admin stats", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

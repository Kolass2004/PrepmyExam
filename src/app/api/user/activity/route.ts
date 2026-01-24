import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        // Fetch valid attempts with timestamps
        const attemptsSnapshot = await adminDb.collection("attempts")
            .where("userId", "==", uid)
            .get();

        const activityMap: Record<string, number> = {};

        attemptsSnapshot.forEach(doc => {
            const data = doc.data();
            // Check for completedAt or createdAt. Firestore timestamps need .toDate()
            let dateObj: Date | null = null;

            if (data.completedAt?.toDate) {
                dateObj = data.completedAt.toDate();
            } else if (data.createdAt?.toDate) {
                dateObj = data.createdAt.toDate();
            } else if (data.completedAt) {
                dateObj = new Date(data.completedAt);
            }

            if (dateObj) {
                // Format: YYYY-MM-DD
                const dateStr = dateObj.toISOString().split('T')[0];
                activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
            }
        });

        // Convert map to array for graph
        const activityData = Object.entries(activityMap).map(([date, count]) => ({
            date,
            count,
            level: getLevel(count)
        }));

        return NextResponse.json({ activity: activityData });

    } catch (error) {
        console.error("Error fetching activity:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
}

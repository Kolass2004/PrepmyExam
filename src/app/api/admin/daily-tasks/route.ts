import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

// GET /api/admin/daily-tasks - Fetch all users with daily task profiles
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const statusFilter = searchParams.get("status") || "all"; // all | active | deprecated
        const search = searchParams.get("search") || "";

        // Get all users
        const usersSnapshot = await adminDb.collection("users").get();

        let users: any[] = [];

        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const goal = data.goal;

            // Only include users with a goal and dailyTaskProfile
            if (goal && goal.dailyTaskProfile) {
                const profile = goal.dailyTaskProfile;

                // Apply status filter
                if (statusFilter !== "all" && profile.status !== statusFilter) {
                    continue;
                }

                // Apply search filter (email or uid)
                if (search) {
                    const emailMatch = data.email?.toLowerCase().includes(search.toLowerCase());
                    const uidMatch = doc.id.toLowerCase().includes(search.toLowerCase());
                    if (!emailMatch && !uidMatch) {
                        continue;
                    }
                }

                // Get latest task info
                const latestTaskSnapshot = await adminDb
                    .collection("users")
                    .doc(doc.id)
                    .collection("daily_tasks")
                    .orderBy("createdAt", "desc")
                    .limit(1)
                    .get();

                const latestTask = latestTaskSnapshot.docs[0]?.data() || null;

                users.push({
                    uid: doc.id,
                    email: data.email || "N/A",
                    displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
                    exam: goal.exam,
                    profile: {
                        status: profile.status,
                        consecutiveMissed: profile.consecutiveMissed || 0,
                        appealsUsed: profile.appealsUsed || 0,
                        lastGeneratedAt: profile.lastGeneratedAt || null,
                        lastAttemptedAt: profile.lastAttemptedAt || null,
                    },
                    latestTask: latestTask ? {
                        title: latestTask.title,
                        createdAt: latestTask.createdAt,
                        questionCount: latestTask.questionCount || latestTask.questions?.length || 0,
                    } : null
                });
            }
        }

        // Calculate stats
        const stats = {
            total: users.length,
            active: users.filter(u => u.profile.status === 'active').length,
            deprecated: users.filter(u => u.profile.status === 'deprecated').length,
            totalAppealsUsed: users.reduce((sum, u) => sum + (u.profile.appealsUsed || 0), 0),
            generatedToday: users.filter(u => {
                const today = new Date().toISOString().split('T')[0];
                return u.profile.lastGeneratedAt?.startsWith(today);
            }).length
        };

        // Pagination
        const startIndex = (page - 1) * limit;
        const paginatedUsers = users.slice(startIndex, startIndex + limit);

        return NextResponse.json({
            users: paginatedUsers,
            stats,
            pagination: {
                page,
                limit,
                total: users.length,
                totalPages: Math.ceil(users.length / limit)
            }
        });

    } catch (error: any) {
        console.error("Admin Daily Tasks GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

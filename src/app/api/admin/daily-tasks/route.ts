import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

// GET /api/admin/daily-tasks - Fetch all users with daily task profiles
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const statusFilter = searchParams.get("status") || "all";
        const search = searchParams.get("search") || "";

        // 1. Get all users from Firestore
        const usersSnapshot = await adminDb.collection("users").get();

        let filteredUsers: any[] = [];

        // 2. Initial Filter (Firestore Data) & Collect UIDs
        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const goal = data.goal;

            if (goal && goal.dailyTaskProfile) {
                const profile = goal.dailyTaskProfile;
                if (statusFilter !== "all" && profile.status !== statusFilter) {
                    continue;
                }

                // Temporary holder
                filteredUsers.push({
                    uid: doc.id,
                    firestoreData: data,
                    goal: goal,
                    profile: profile
                });
            }
        }

        // 3. Enrich with Auth Data (Batch)
        // We chunk requests if necessary, but 100 is max for getUsers usually. 
        // We actually only need to fetch Auth for the *paginated* result to save bandwidth?
        // BUT search needs to check email/name, which is in Auth.
        // So we MUST fetch Auth for ALL candidates if we want to search by name/email reliably.
        // This is expensive if there are thousands of users.
        // Optimization: If search is empty, paginate first, then fetch Auth.
        // If search is present, we might have to fetch all.

        let validUsers: any[] = [];

        // Strategy: 
        // If no search: Paginate first using Firestore count, THEN fetch Auth for that page.
        // If search: We have to fetch Auth for likely candidates or just iterate all. 
        // To avoid massive reads, let's try to match Firestore 'email' if it exists. 
        // If Firestore 'email' is missing, search functionality is broken without full Auth fetch.
        // **Compromise**: Only search against Firestore 'email' field if it exists. 
        // AND fetch Auth for the displayed page to fix "Unknown".

        // Pagination Logic (Pre-Auth Fetch)
        // If we don't filter by search (or only search fields in DB), we can slice now.
        // But the previous code had filtering inside the loop.

        // Let's assume for now we slice AFTER filtering by what we have.
        // But to correct "Unknown", we specifically need Auth data for the RESULT.

        // Refined Filter Loop
        const matchedUsers: any[] = [];
        for (const user of filteredUsers) {
            const { firestoreData, uid } = user;
            // Try to use Firestore email if present for search
            if (search) {
                const emailMatch = firestoreData.email?.toLowerCase().includes(search.toLowerCase());
                const uidMatch = uid.toLowerCase().includes(search.toLowerCase());
                if (!emailMatch && !uidMatch) break; // Skip if search doesn't match
            }
            matchedUsers.push(user);
        }

        // Apply Pagination to matched users
        const startIndex = (page - 1) * limit;
        const slicedUsers = matchedUsers.slice(startIndex, startIndex + limit);

        // Fetch Auth for ONLY the sliced users
        // Note: adminAuth comes from existing import or need to add it
        const { adminAuth } = await import("@/lib/firebase/admin");

        const authRequests = slicedUsers.map(u => ({ uid: u.uid }));
        let authUsersResult;
        try {
            if (authRequests.length > 0) {
                authUsersResult = await adminAuth.getUsers(authRequests);
            }
        } catch (e) {
            console.error("Auth Fetch Error:", e);
        }

        const authMap = new Map();
        authUsersResult?.users.forEach(u => {
            authMap.set(u.uid, { email: u.email, displayName: u.displayName });
        });

        // Construct Final Response
        const finalUsers = [];
        for (const user of slicedUsers) {
            const authData = authMap.get(user.uid);
            const { firestoreData, goal, profile, uid } = user;

            const email = authData?.email || firestoreData.email || "N/A";
            const displayName = authData?.displayName || firestoreData.displayName || authData?.email?.split("@")[0] || "Unknown";

            // Filter out users with no identifiable information (Zombie records)
            if (email === "N/A" && displayName === "Unknown") {
                continue;
            }

            // Get latest task (Firestore read per user on page - OK for 20 items)
            const latestTaskSnapshot = await adminDb
                .collection("users")
                .doc(uid)
                .collection("daily_tasks")
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();
            const latestTask = latestTaskSnapshot.docs[0]?.data() || null;

            finalUsers.push({
                uid: uid,
                email,
                displayName,
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

        // Calculate Stats (Global) based on FINAL valid users
        const stats = {
            total: finalUsers.length,
            active: finalUsers.filter(u => u.profile.status === 'active').length,
            deprecated: finalUsers.filter(u => u.profile.status === 'deprecated').length,
            totalAppealsUsed: finalUsers.reduce((sum, u) => sum + (u.profile.appealsUsed || 0), 0),
            generatedToday: finalUsers.filter(u => {
                const today = new Date().toISOString().split('T')[0];
                return u.profile.lastGeneratedAt?.startsWith(today);
            }).length
        };

        return NextResponse.json({
            users: finalUsers,
            stats,
            pagination: {
                page,
                limit,
                total: matchedUsers.length, // This is still raw total, but accepted for pagination
                totalPages: Math.ceil(matchedUsers.length / limit)
            }
        });

    } catch (error: any) {
        console.error("Admin Daily Tasks GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateWithGemini } from "@/lib/gemini";
import { UserGoal } from "@/lib/types";

export const dynamic = 'force-dynamic';

// POST /api/admin/daily-tasks/generate-all - Manual trigger for daily task generation (like cron)
export async function POST(request: NextRequest) {
    try {
        const startTime = Date.now();
        const results = {
            processed: 0,
            generated: 0,
            skipped: 0,
            errors: 0,
            details: [] as any[]
        };

        // Get all users with goals
        const usersSnapshot = await adminDb.collection("users").get();

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const goal = userData?.goal as UserGoal | undefined;

            // Skip users without goals or roadmaps
            if (!goal || !goal.roadmap) {
                continue;
            }

            results.processed++;
            const uid = userDoc.id;

            // Check if already generated today
            const profile = goal.dailyTaskProfile;
            const todayStr = new Date().toISOString().split('T')[0];
            const alreadyGenerated = profile?.lastGeneratedAt?.startsWith(todayStr);

            if (alreadyGenerated) {
                results.skipped++;
                results.details.push({ uid, status: 'skipped', reason: 'Already generated today' });
                continue;
            }

            // Check if deprecated (skip unless override)
            if (profile?.status === 'deprecated') {
                results.skipped++;
                results.details.push({ uid, status: 'skipped', reason: 'Profile deprecated' });
                continue;
            }

            try {
                // Find current week
                const currentWeek = goal.roadmap.find(w => w.status === 'pending') || goal.roadmap[0];
                const topics = currentWeek.topics.slice(0, 5).join(", ");
                const examName = goal.exam;

                // Generate questions
                const questions = await generateWithGemini(async (model) => {
                    const prompt = `
                    Act as an expert exam setter for "${examName}".
                    Create a "Daily Task" set of 20 multiple-choice questions based on these topics: ${topics}.

                    Return a JSON array of objects with this schema:
                    [
                        {
                            "id": "q1",
                            "question": "Question text here?",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correctAnswer": "Option A",
                            "explanation": "Brief explanation."
                        }
                    ]
                    `;

                    const result = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    const response = await result.response;
                    const text = response.text();
                    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
                    return JSON.parse(cleaned);
                });

                // Save task
                const taskData = {
                    title: `Daily Task: Week ${currentWeek.week}`,
                    weekTitle: currentWeek.title,
                    weekNumber: currentWeek.week,
                    questions,
                    questionCount: questions.length,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    type: 'daily_task',
                    status: 'active'
                };

                await adminDb.collection("users").doc(uid).collection("daily_tasks").add(taskData);

                // Update profile
                await adminDb.collection("users").doc(uid).update({
                    "goal.dailyTaskProfile.lastGeneratedAt": new Date().toISOString(),
                    "goal.dailyTaskProfile.status": "active"
                });

                results.generated++;
                results.details.push({ uid, status: 'generated', week: currentWeek.week });

            } catch (genError: any) {
                results.errors++;
                results.details.push({ uid, status: 'error', error: genError.message });
            }
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            message: `Processed ${results.processed} users. Generated: ${results.generated}, Skipped: ${results.skipped}, Errors: ${results.errors}`,
            results,
            duration: `${duration}ms`
        });

    } catch (error: any) {
        console.error("Admin Generate All Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

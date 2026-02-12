
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateWithGemini } from "@/lib/gemini";
import { UserGoal, DailyTaskProfile } from "@/lib/types";

export const maxDuration = 60; // Allow longer timeout for batch generation

// Use a simple secret to protect the endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

export async function POST(request: NextRequest) {
    // 1. Authorization Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const targetUid = searchParams.get('uid');

        console.log(`CRON: Starting Daily Task Generation... ${targetUid ? `(Target: ${targetUid})` : ''}`);

        // 2. Fetch Active Users
        let usersSnapshot;
        if (targetUid) {
            const doc = await adminDb.collection("users").doc(targetUid).get();
            // Mock QuerySnapshot structure for consistency
            usersSnapshot = { docs: doc.exists ? [doc] : [] };
        } else {
            usersSnapshot = await adminDb.collection("users").get();
        }

        let processedCount = 0;
        let generatedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        const results = [];

        // 3. Iterate and Process
        // We use a for...of loop to control concurrency if needed, or Promise.all for speed.
        // Given Gemini rate limits, we should probably do small batches or sequential.
        // Let's do batches of 3 to respect rate limits.
        const batchSize = 3;
        const docs = usersSnapshot.docs;

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);

            const batchPromises = batch.map(async (doc) => {
                const uid = doc.id;
                const userData = doc.data();
                const goal = userData.goal as UserGoal | undefined;

                // --- Validation Checks ---
                if (!goal || goal.status !== 'completed' || !goal.roadmap) {
                    return { uid, status: 'skipped', reason: 'No active goal' };
                }

                // Initialize Profile if missing (Lazy Init)
                let dailyProfile = userData.goal.dailyTaskProfile as DailyTaskProfile | undefined;
                if (!dailyProfile) {
                    dailyProfile = {
                        status: 'active',
                        consecutiveMissed: 0,
                        appealsUsed: 0,
                        lastGeneratedAt: null,
                        lastAttemptedAt: null
                    };
                    // We'll save this back if we generate, or strictly save it now? 
                    // Let's use it in memory for now.
                }

                if (dailyProfile.status === 'deprecated') {
                    return { uid, status: 'skipped', reason: 'User deprecated' };
                }

                // Check if already generated for today
                const today = new Date().toISOString().split('T')[0];
                const lastGen = dailyProfile.lastGeneratedAt ? dailyProfile.lastGeneratedAt.split('T')[0] : null;

                if (lastGen === today) {
                    return { uid, status: 'skipped', reason: 'Already generated today' };
                }

                // --- Generation Logic ---
                try {
                    // Find current week
                    const currentWeek = goal.roadmap.find(w => w.status === 'pending') || goal.roadmap[0];
                    const topics = currentWeek.topics.slice(0, 5).join(", ");
                    const examName = goal.exam;
                    const weekTitle = currentWeek.title;

                    // Generate 20 Questions
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
                                "explanation": "Brief explanation of why A is correct."
                            }
                        ]
                        - Ensure questions are very relevant and challenging.
                        - Title the set "Daily Task: Week ${currentWeek.week}".
                        - STRICT JSON format. Escape all newlines within strings.
                        `;

                        const result = await model.generateContent({
                            contents: [{ role: "user", parts: [{ text: prompt }] }],
                            generationConfig: { responseMimeType: "application/json" }
                        });
                        const response = await result.response;
                        let text = response.text();

                        // Clean markdown
                        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

                        try {
                            return JSON.parse(text);
                        } catch (parseError) {
                            console.error("JSON Parse 1st Attempt Failed. Cleaning...");
                            // Try to escape unescaped newlines in strings (fragile but helps)
                            // text = text.replace(/\n/g, "\\n"); // This breaks structure.
                            // Simply throw for now, but logged.
                            throw parseError;
                        }
                    });

                    // Save Task
                    const now = new Date();
                    const taskData = {
                        title: `Daily Task: Week ${currentWeek.week}`,
                        weekTitle: weekTitle,
                        weekNumber: currentWeek.week,
                        questions: questions,
                        questionCount: questions.length,
                        createdAt: now.toISOString(),
                        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                        type: 'daily_task',
                        status: 'active'
                    };

                    await adminDb.collection("users").doc(uid).collection("daily_tasks").add(taskData);

                    // Update User Profile
                    dailyProfile.lastGeneratedAt = now.toISOString();

                    // Update goal with new profile
                    await adminDb.collection("users").doc(uid).update({
                        "goal.dailyTaskProfile": dailyProfile
                    });

                    return { uid, status: 'success' };

                } catch (genError: any) {
                    console.error(`Error generating for ${uid}:`, genError);
                    return { uid, status: 'error', reason: genError.message };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            processedCount += batchResults.length;
            generatedCount += batchResults.filter(r => r.status === 'success').length;
            skippedCount += batchResults.filter(r => r.status === 'skipped').length;
            errorCount += batchResults.filter(r => r.status === 'error').length;

            // Small delay between batches to be nice to Gemini
            if (i + batchSize < docs.length) {
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        return NextResponse.json({
            success: true,
            summary: { processed: processedCount, generated: generatedCount, skipped: skippedCount, errors: errorCount },
            results
        });

    } catch (error: any) {
        console.error("CRON Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

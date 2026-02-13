
import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase/admin";
import { UserGoal } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid } = body;

        if (!uid) {
            return NextResponse.json({ error: "Missing uid" }, { status: 400 });
        }

        console.log(`API: Generatin Daily Task for ${uid}`);

        // 1. Get User Goal & Roadmap (Merged Logic)
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const userData = userDoc.data();
        const goal = userData?.goal as UserGoal | undefined;

        if (!goal || !goal.roadmap) {
            return NextResponse.json({ error: "No active goal found. Create a roadmap first." }, { status: 400 });
        }

        // 2. Find Current Week
        const currentWeek = goal.roadmap.find(w => w.status === 'pending') || goal.roadmap[0];
        const topics = currentWeek.topics.slice(0, 5).join(", "); // Limit topics context
        const examName = goal.exam;
        const weekTitle = currentWeek.title;

        // 3. Generate 20 Questions (Merged Logic with JSON Mode)
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
            - Ensure questions are relevant and challenging.
            - Title the set "Daily Task: Week ${currentWeek.week}".
            `;

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const response = await result.response;
            const text = response.text();

            // Cleanup markdown if present
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        });

        // 4. Save to Firestore
        const taskData = {
            title: `Daily Task: Week ${currentWeek.week}`, // Renamed from Daily Drill
            weekTitle: weekTitle,
            weekNumber: currentWeek.week,
            questions: questions,
            questionCount: questions.length,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
            type: 'daily_task', // Changed to match standard
            status: 'active'
        };

        const docRef = await adminDb.collection("users").doc(uid).collection("daily_tasks").add(taskData);

        // Update dailyTaskProfile.lastGeneratedAt so crons know this user has today's task
        await adminDb.collection("users").doc(uid).update({
            "goal.dailyTaskProfile.lastGeneratedAt": new Date().toISOString(),
            "goal.dailyTaskProfile.status": "active"
        });

        return NextResponse.json({ success: true, taskId: docRef.id });

    } catch (error: any) {
        console.error("Error generating daily task:", error);
        return NextResponse.json({ error: error.message || "Failed to generate daily task" }, { status: 500 });
    }
}

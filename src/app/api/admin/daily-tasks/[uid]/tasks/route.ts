import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateWithGemini } from "@/lib/gemini";
import { UserGoal } from "@/lib/types";

export const dynamic = 'force-dynamic';

// GET /api/admin/daily-tasks/[uid]/tasks - Get all tasks for a user
export async function GET(
    request: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        const { uid } = params;

        const tasksSnapshot = await adminDb
            .collection("users")
            .doc(uid)
            .collection("daily_tasks")
            .orderBy("createdAt", "desc")
            .get();

        const tasks = tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            const now = new Date();
            const expiresAt = new Date(data.expiresAt);
            const isExpired = now > expiresAt;

            return {
                id: doc.id,
                title: data.title,
                weekNumber: data.weekNumber,
                weekTitle: data.weekTitle,
                questionCount: data.questionCount || data.questions?.length || 0,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                status: isExpired ? 'expired' : data.status,
                score: data.score || null,
                attemptedAt: data.attemptedAt || null,
            };
        });

        return NextResponse.json({ tasks });

    } catch (error: any) {
        console.error("Admin Tasks GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/daily-tasks/[uid]/tasks - Manually generate task for user (Admin Override)
export async function POST(
    request: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        const { uid } = params;

        // Get user's goal
        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        const goal = userData?.goal as UserGoal | undefined;

        if (!goal || !goal.roadmap) {
            return NextResponse.json({ error: "User has no active goal/roadmap" }, { status: 400 });
        }

        // Find current week
        const currentWeek = goal.roadmap.find(w => w.status === 'pending') || goal.roadmap[0];
        const topics = currentWeek.topics.slice(0, 5).join(", ");
        const examName = goal.exam;

        // Generate questions using Gemini
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

            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        });

        // Save to Firestore
        const taskData = {
            title: `Daily Task: Week ${currentWeek.week} (Admin Generated)`,
            weekTitle: currentWeek.title,
            weekNumber: currentWeek.week,
            questions: questions,
            questionCount: questions.length,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            type: 'daily_task',
            status: 'active',
            adminGenerated: true
        };

        const docRef = await adminDb.collection("users").doc(uid).collection("daily_tasks").add(taskData);

        // Update lastGeneratedAt
        await adminDb.collection("users").doc(uid).update({
            "goal.dailyTaskProfile.lastGeneratedAt": new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: "Task generated successfully by admin",
            taskId: docRef.id
        });

    } catch (error: any) {
        console.error("Admin Generate Task Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

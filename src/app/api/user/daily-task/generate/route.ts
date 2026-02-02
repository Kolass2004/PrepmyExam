
import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { uid, examName, weekTitle, topics } = await request.json();

        if (!uid || !examName || !topics || topics.length === 0) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        console.log(`API: Generating Daily Task for ${uid} - ${examName} - ${weekTitle}`);

        const prompt = `
            Act as an expert exam setter for "${examName}".
            Create a "Daily Practice Set" for the week: "${weekTitle}".
            Generate exactly 15 Multiple Choice Questions based on: ${topics.join(", ")}.

            Strictly follow this JSON format:
            [
                {
                    "title": "Daily Task: ${weekTitle}",
                    "questions": [
                        {
                            "id": 1,
                            "question": "Question text here",
                            "options": {
                                "a": "Option A",
                                "b": "Option B",
                                "c": "Option C",
                                "d": "Option D"
                            },
                            "correct_answer": "a"
                        }
                    ]
                }
            ]
            
            IMPORTANT: 
            - Return the JSON as a SINGLE LINE string.
            - Do NOT include any raw newlines or line breaks.
            - Escape any necessary newlines within strings as \\n.
            - ONLY return the valid JSON string.
        `;

        const generatedTaskArray = await generateWithGemini(async (model) => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanupMarkdown = (text: string) => {
                // 1. Remove markdown
                let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
                // 2. Aggressively remove all raw newlines to prevent JSON.parse errors
                // This converts structural newlines to spaces (fine for JSON)
                clean = clean.replace(/[\r\n]+/g, " ");
                return clean;
            };

            const cleanedText = cleanupMarkdown(text);
            return JSON.parse(cleanedText);
        });

        // Handle array response (since prompt requests array of sets)
        const generatedTask = Array.isArray(generatedTaskArray) ? generatedTaskArray[0] : generatedTaskArray;

        if (!generatedTask || !generatedTask.questions) {
            throw new Error("Failed to generate valid questions");
        }

        // Add metadata
        const taskId = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        const dailyTask = {
            id: taskId,
            type: 'daily_task',
            title: generatedTask.title,
            targetExamId: 'daily_task', // Placeholder or unnecessary for this type
            questions: generatedTask.questions,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active', // 'active' | 'expired'
            questionCount: generatedTask.questions.length,
            examName: examName,
            weekTitle: weekTitle,
            progress: {
                answeredCount: 0, // Initial progress
                timestamp: now.toISOString()
            }
        };

        // Save to subcollection 'daily_tasks' for the user or 'exams' if using a unified list?
        // Dashboard fetches from `api/user/exams` (which is unified?), let's verify dashboard fetching.
        // Dashboard puts 'sets' in one tab, 'recents' in another, 'tasks' in another.
        // We can just store this in a 'daily_tasks' subcollection for clean separation.

        await adminDb.collection("users").doc(uid).collection("daily_tasks").doc(taskId).set(dailyTask);

        return NextResponse.json({ success: true, taskId });

    } catch (error: any) {
        console.error("Error generating daily task:", error);
        return NextResponse.json({ error: error.message || "Failed to generate daily task" }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase/admin";
import { RoadmapWeek } from "@/lib/types";

export async function POST(request: NextRequest) {
    let uid;
    try {
        const body = await request.json();
        const { examName, daysRemaining } = body;
        uid = body.uid;

        if (!examName || !daysRemaining || !uid) {
            return NextResponse.json({ error: "Missing examName, daysRemaining, or uid" }, { status: 400 });
        }

        const cleanupMarkdown = (text: string) => {
            return text.replace(/```json/g, "").replace(/```/g, "").trim();
        };

        // We run the generation logic.
        // To allow the frontend to be responsive, this route is called "fire and forget" style by the frontend (it doesn't await the result to close the modal).
        // However, we must ensure this function completes even if the response is returned? 
        // No, in standard Next.js serverless functions, checking "waitUntil" is tricky.
        // For this specific request, the user wants the "Modal to close automatically".
        // The safest way is:
        // 1. Frontend: Calls API.
        // 2. Frontend: Immediately closes Modal.
        // 3. Frontend: Shows "Generating..." toast.
        // 4. API: Runs.
        // 5. Frontend: Awaits API response.
        // 6. Frontend: On success, shows "Done".

        // So the API just needs to do the work and wait.
        console.log("API: Starting Gemini generation...");

        const roadmap = await generateWithGemini(async (model) => {
            // Calculate weeks roughly
            const weeks = Math.ceil(daysRemaining / 7);
            const cappedWeeks = weeks; // Removed 16-week limit as per user request

            const prompt = `Act as an expert exam tutor. Create a playful, high-energy, and structured study roadmap for the "${examName}" exam, covering the next ${cappedWeeks} weeks.
        
            The user has ${daysRemaining} days left.
            
            Return a JSON array of objects, where each object represents a ONE WEEK.
            Format:
            [
                {
                    "week": 1,
                    "title": "Week 1: Foundations & Fun!",
                    "topics": ["Topic 1", "Topic 2", "Topic 3"],
                    "description": "Short motivational or descriptive text for this week."
                }
            ]

            - Ensure the topics are relevant to ${examName}.
            - Make the titles catchy and "playful".
            - Include "Revisions" and "Mock Tests".
            - Cover the entire duration (up to ${cappedWeeks} weeks) comprehensively.
            - ONLY return the raw JSON array.
            `;

            console.log("API: Sending Prompt to Gemini:", prompt);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log("API: Raw Gemini Response:", text);

            return JSON.parse(cleanupMarkdown(text));
        });

        console.log("API: Roadmap generated successfully. Items:", roadmap?.length);

        // Update Firestore
        console.log("API: Updating Firestore with roadmap...");
        await adminDb.collection("users").doc(uid).set({
            goal: {
                roadmap: roadmap,
                status: 'completed',
                generatedAt: new Date().toISOString()
            }
        }, { merge: true });

        console.log("API: Firestore updated. Sending success response.");

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error generating roadmap:", error);

        if (uid) {
            console.log(`Attempting to set error status for user: ${uid}`);
            try {
                await adminDb.collection("users").doc(uid).set({
                    goal: {
                        status: 'error',
                        error: error instanceof Error ? error.message : "Unknown error"
                    }
                }, { merge: true });
                console.log("Successfully set error status in Firestore.");
            } catch (fsError) {
                console.error("Failed to write error status to Firestore:", fsError);
            }
        } else {
            console.error("Cannot set error status: UID is missing/undefined in catch block.");
        }

        return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
    }
}

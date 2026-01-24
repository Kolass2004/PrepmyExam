import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, questionContext } = body;

        const responseContent = await generateWithGemini(async (model) => {
            // Construct history with system instruction
            const history = [
                {
                    role: "user",
                    parts: [{
                        text: `You are a helpful, encouraging tutor helping a student with a bank exam question.
                        
                        Current Question:
                        ${questionContext}

                        RULES:
                        1. STRICTLY DO NOT reveal the final answer (Option A, B, C, or D) unless the user explicitly says "I surrender" or "tell me the answer".
                        2. If the user asks for a hint, give a subtle clue.
                        3. If the user guesses wrong, explain why it's wrong without giving the right answer immediately.
                        4. Keep responses concise and conversational.
                        5. Use emojis to be friendly.
                        `
                    }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood! I will help you solve this question without giving away the answer unless you surrender. What's on your mind?" }]
                },
                ...messages.map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ];

            const chat = model.startChat({
                history: history.slice(0, -1), // All except last message which is the new prompt
            });

            const lastMessage = messages[messages.length - 1].content;
            const result = await chat.sendMessage(lastMessage);
            return result.response.text();
        });

        return NextResponse.json({ content: responseContent });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({
            error: "Failed to generate response",
            details: error.message || String(error)
        }, { status: 500 });
    }
}

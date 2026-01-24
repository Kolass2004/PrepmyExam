
import { GoogleGenerativeAI } from "@google/generative-ai";

const KEYS = [
    process.env.GEMINI_API,
    process.env.GEMINI_API_A,
    process.env.GEMINI_API_B,
    process.env.GEMINI_API_C,
    process.env.GEMINI_API_D,
].filter(Boolean) as string[];

// Initialize with a random index to distribute load across keys
// This helps prevent "Key 0" from being hammered/exhausted exclusively on every serverless cold start
let currentKeyIndex = Math.floor(Math.random() * KEYS.length);
let lastResetTime = Date.now();

const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

function checkAndResetKey() {
    const now = Date.now();
    if (now - lastResetTime > RESET_INTERVAL) {
        console.log("Resetting Gemini API key to default (24h passed)");
        currentKeyIndex = 0;
        lastResetTime = now;
    }
}

export async function generateWithGemini(
    callback: (model: any) => Promise<any>
) {
    checkAndResetKey();

    let attempts = 0;
    const maxAttempts = KEYS.length;

    while (attempts < maxAttempts) {
        console.log(`Using Gemini Key Index: ${currentKeyIndex}`);
        const apiKey = KEYS[currentKeyIndex];

        try {
            const genAI = new GoogleGenerativeAI(apiKey);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            return await callback(model);

        } catch (error: any) {
            const isQuotaError =
                error?.message?.includes('429') ||
                error?.message?.includes('Quota') ||
                error?.status === 429 ||
                error?.message?.includes('Resource has been exhausted');

            if (isQuotaError) {
                console.warn(`Gemini Key ${currentKeyIndex} exhausted. Rotating...`);
                attempts++;
                currentKeyIndex = (currentKeyIndex + 1) % KEYS.length;
            } else {

                throw error;
            }
        }
    }

    throw new Error("All Gemini API keys exhausted.");
}

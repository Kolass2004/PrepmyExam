const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
        console.error("No GEMINI_API found in .env.local");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // There isn't a direct "listModels" on genAI instance in some versions, 
        // usually it's direct API call or via model manager? 
        // Actually SDK usually doesn't expose listModels easily in the minimal client.
        // Let's try a simple generateContent with a very standard model to verify basic connectivity.
        // We'll try 'gemini-1.5-flash' again, but cleaner.

        // Better yet, let's just use standard fetch to list models.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();


/**
 * Daily Task System Verification Script
 * 
 * Usage: 
 * 1. Ensure your local server is running (http://localhost:3000)
 * 2. Run: npx ts-node src/scripts/verify-daily-system.ts <USER_UID>
 * 
 * This script will:
 * 1. Generate a daily task for the user (via Cron API)
 * 2. Verify the task was created (via User API)
 * 3. Trigger email reminders (via Cron API)
 * 4. Trigger deprecation check (via Cron API) - Note: This might increment missed count
 * 5. Attempt an appeal (via Appeal API)
 */

import fetch from 'node-fetch'; // You might need: npm install node-fetch @types/node-fetch

const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret'; // Default or from env

async function verifySystem() {
    const uid = process.argv[2];

    if (!uid) {
        console.error("Error: Please provide a User UID as an argument.");
        console.log("Usage: npx ts-node src/scripts/verify-daily-system.ts <USER_UID>");
        process.exit(1);
    }

    console.log(`\n🔍 Starting Verification for User: ${uid}`);
    console.log(`Target: ${BASE_URL}`);
    console.log("--------------------------------------------------");

    // 1. Generate Task
    console.log("\n[1] Testing Task Generation...");
    const genRes = await fetch(`${BASE_URL}/api/cron/generate-task?uid=${uid}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
    });
    const genData = await genRes.json();
    console.log("Status:", genRes.status, genRes.statusText);
    console.log("Response:", JSON.stringify(genData, null, 2));

    if (genRes.status !== 200 || !genData.success) {
        console.error("❌ Generation Failed");
        // Continue anyway to test other parts?
    }

    // 2. Verify Task Existence
    console.log("\n[2] Verifying Task in User Profile...");
    const userTaskRes = await fetch(`${BASE_URL}/api/user/daily-task?uid=${uid}`);
    const userTaskData = await userTaskRes.json();

    if (userTaskData.tasks && userTaskData.tasks.length > 0) {
        const latestInfo = userTaskData.tasks[0];
        console.log(`✅ User has ${userTaskData.tasks.length} tasks.`);
        console.log(`   Latest: "${latestInfo.title}" (ID: ${latestInfo.id})`);
        console.log(`   Created: ${latestInfo.createdAt}`);
    } else {
        console.warn("⚠️ No tasks found for user. Generation might have skipped (e.g. already exists today).");
    }

    // 3. Trigger Email Notifications
    console.log("\n[3] Testing Email Notifications (Reminder)...");
    const emailRes = await fetch(`${BASE_URL}/api/cron/send-email?uid=${uid}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CRON_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reminder' })
    });
    const emailData = await emailRes.json();
    console.log("Response:", JSON.stringify(emailData, null, 2));

    // 3b. Trigger Email Notifications (Warning)
    console.log("\n[3b] Testing Email Notifications (Warning)...");
    const warnRes = await fetch(`${BASE_URL}/api/cron/send-email?uid=${uid}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CRON_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'warning' })
    });
    const warnData = await warnRes.json();
    console.log("Response:", JSON.stringify(warnData, null, 2));

    // 4. Test Deprecation Logic (Warning: This increments missed count!)
    console.log("\n[4] Testing Deprecation Logic (Simulate Miss)...");
    console.log("⚠️  Note: This will likely increment 'consecutiveMissed' for this user if they haven't attempted today's task.");
    const depRes = await fetch(`${BASE_URL}/api/cron/check-deprecation?uid=${uid}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
    });
    const depData = await depRes.json();
    console.log("Response:", JSON.stringify(depData, null, 2));

    // 5. Test Appeal (Only works if deprecated, but endpoint should respond)
    console.log("\n[5] Testing Appeal Endpoint...");
    const appealRes = await fetch(`${BASE_URL}/api/user/daily-task/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
    });
    const appealData = await appealRes.json();
    console.log("Response:", JSON.stringify(appealData, null, 2));

    console.log("\n--------------------------------------------------");
    console.log("✅ Verification Logic Completed.");
}

verifySystem().catch(err => console.error("Fatal Error:", err));

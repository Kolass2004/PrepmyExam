
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/mail";
import { UserGoal, DailyTaskProfile } from "@/lib/types";
import { getISTDateString, toISTDateString } from "@/lib/dates";

// Allow longer timeout for large batch sending
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

// Vercel Crons use GET requests — action comes from query param
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action || !['reminder', 'warning'].includes(action)) {
        return NextResponse.json({ error: "Invalid action. Use ?action=reminder or ?action=warning" }, { status: 400 });
    }

    return handleSendEmail(request, action);
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // POST body takes priority, fallback to query param
        let action: string | null = null;
        try {
            const body = await request.json();
            action = body.action;
        } catch {
            // No body, check query param
            action = new URL(request.url).searchParams.get('action');
        }

        if (!action || !['reminder', 'warning'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return handleSendEmail(request, action);
    } catch (error: any) {
        console.error("CRON Email Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleSendEmail(request: NextRequest, action: string) {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://prepmyexam.in';

    try {
        console.log(`CRON: Sending Email Action: ${action}`);

        const { searchParams } = new URL(request.url);
        const targetUid = searchParams.get('uid');

        let usersSnapshot;
        if (targetUid) {
            const doc = await adminDb.collection("users").doc(targetUid).get();
            usersSnapshot = { docs: doc.exists ? [doc] : [] };
        } else {
            usersSnapshot = await adminDb.collection("users").get();
        }

        // Use IST date for all comparisons
        const todayIST = getISTDateString();

        let sentCount = 0;
        let errors = 0;
        const debugLogs: string[] = [];

        for (const doc of usersSnapshot.docs) {
            const uid = doc.id;
            const userData = doc.data();
            const goal = userData?.goal as UserGoal | undefined;
            let email = userData?.email;

            // Fallback: Fetch email from Auth if missing
            if (!email) {
                try {
                    const userRecord = await adminAuth.getUser(uid);
                    email = userRecord.email;
                    if (targetUid && email) debugLogs.push(`Fetched email from Auth for ${uid}`);
                } catch (e) { /* Ignore */ }
            }

            if (!email || !goal || goal.status !== 'completed' || !goal.dailyTaskProfile || goal.dailyTaskProfile.status === 'deprecated') {
                if (targetUid) {
                    const msg = `Skipping ${uid}: Email:${!!email}, Goal:${!!goal}, Status:${goal?.status}, Profile:${!!goal?.dailyTaskProfile}, Deprecated:${goal?.dailyTaskProfile?.status === 'deprecated'}`;
                    console.log(msg);
                    debugLogs.push(msg);
                }
                continue;
            }

            const profile = goal.dailyTaskProfile;
            // Convert timestamps to IST dates for comparison
            const lastGenDateIST = profile.lastGeneratedAt ? toISTDateString(profile.lastGeneratedAt) : null;
            const lastAttDateIST = profile.lastAttemptedAt ? toISTDateString(profile.lastAttemptedAt) : null;

            // --- REMINDER LOGIC (8:30 AM IST) ---
            if (action === 'reminder') {
                // Send if generated today (IST) AND not attempted today (IST)
                if (lastGenDateIST === todayIST && lastAttDateIST !== todayIST) {
                    try {
                        await sendEmail({
                            to: email,
                            subject: "Wake Up! Your Daily Drill is Ready 🎯",
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2>Good Morning! ☀️</h2>
                                    <p>Your 20 daily practice questions for <b>${goal.exam}</b> have been generated.</p>
                                    <p>Can you beat your best score today?</p>
                                    <br/>
                                    <a href="${APP_URL}/exam-dashboard/${goal.exam}?type=daily_task" 
                                       style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                                       Start Daily Task
                                    </a>
                                    <p style="font-size: 12px; color: #666; margin-top: 20px;">
                                        Note: Access closes at 8:00 PM.
                                    </p>
                                </div>
                            `
                        });
                        sentCount++;
                        debugLogs.push(`Sent reminder to ${email}`);
                    } catch (e: any) {
                        console.error(`Failed to send reminder to ${email}`, e);
                        errors++;
                        debugLogs.push(`Failed to send to ${email}: ${e.message}`);
                    }
                } else {
                    if (targetUid) debugLogs.push(`Skipped Reminder: Gen(IST):${lastGenDateIST}, Att(IST):${lastAttDateIST}, Today(IST):${todayIST}`);
                }
            }

            // --- WARNING LOGIC (7:30 PM IST) ---
            if (action === 'warning') {
                // Send if generated today (IST) AND not attempted today (IST)
                if (lastGenDateIST === todayIST && lastAttDateIST !== todayIST) {
                    try {
                        await sendEmail({
                            to: email,
                            subject: "⚠️ 30 Minutes Left! Don't Lose Your Streak",
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2>Hurry Up! ⏳</h2>
                                    <p>You haven't completed your daily task for <b>${goal.exam}</b> yet.</p>
                                    <p>The exam window closes at 8:00 PM (in 30 mins).</p>
                                    <p>Missing tasks consistently may lead to course deprecation.</p>
                                    <br/>
                                    <a href="${APP_URL}/exam-dashboard/${goal.exam}?type=daily_task" 
                                       style="background: #e11d48; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                                       Complete Now
                                    </a>
                                </div>
                            `
                        });
                        sentCount++;
                        debugLogs.push(`Sent warning to ${email}`);
                    } catch (e: any) {
                        console.error(`Failed to send warning to ${email}`, e);
                        errors++;
                        debugLogs.push(`Failed warning to ${email}: ${e.message}`);
                    }
                } else {
                    if (targetUid) debugLogs.push(`Skipped Warning: Gen(IST):${lastGenDateIST}, Att(IST):${lastAttDateIST}, Today(IST):${todayIST}`);
                }
            }
        }

        return NextResponse.json({ success: true, sent: sentCount, errors, debugLogs });

    } catch (error: any) {
        console.error("CRON Email Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

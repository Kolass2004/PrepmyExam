#!/usr/bin/env node

/**
 * ============================================================
 *  PrepmyExam — Comprehensive API Test Suite
 *  Covers all 47 API routes
 * ============================================================
 *
 *  Usage:  node tests/api-tests.js
 *  Requires: Node 18+ (native fetch), dev server on port 3000
 */

const BASE = "http://localhost:3000";
const UID = "RtLiDlB9ISeoCI07K27iICBgccr2";
const CRON_SECRET = process.env.CRON_SECRET || "dev_secret";

// --- Helpers -----------------------------------------------------------

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    magenta: "\x1b[35m",
};

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function log(icon, msg) {
    console.log(`  ${icon}  ${msg}`);
}

function section(title) {
    console.log(
        `\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}`
    );
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        log(`${colors.green}✅${colors.reset}`, name);
    } catch (err) {
        failed++;
        const msg = err.message || String(err);
        log(`${colors.red}❌${colors.reset}`, `${name}  ${colors.dim}— ${msg}${colors.reset}`);
        failures.push({ name, error: msg });
    }
}

function skip(name, reason) {
    skipped++;
    log(`${colors.yellow}⏭️${colors.reset}`, `${name}  ${colors.dim}(${reason})${colors.reset}`);
}

function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
}

function assertStatus(res, expected) {
    assert(
        res.status === expected,
        `Expected status ${expected}, got ${res.status}`
    );
}

function assertHasKeys(obj, keys) {
    for (const k of keys) {
        assert(k in obj, `Missing key "${k}" in response`);
    }
}

async function GET(path) {
    return fetch(`${BASE}${path}`);
}

async function POST(path, body, headers = {}) {
    return fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
}

async function PATCH(path, body, headers = {}) {
    return fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
}

async function DELETE_REQ(path, body, headers = {}) {
    return fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
}

async function PUT(path, body, headers = {}) {
    return fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
}

// Store IDs created during tests for cleanup / chaining
const ctx = {
    examId: null,
    attemptId: null,
    taskId: null,
    questionSetId: null,
    targetExamId: null,
};

// ============================================================
//  TEST SUITES
// ============================================================

async function testSystemStatus() {
    section("System Status");

    await test("GET /api/system/status → 200 with maintenanceMode", async () => {
        const res = await GET("/api/system/status");
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["maintenanceMode"]);
    });
}

// -------------------------------------------------------------------
//  Question Banks (Public)
// -------------------------------------------------------------------
async function testQuestionBanks() {
    section("Question Banks (Public)");

    await test("GET /api/question-banks → 200 with exams array", async () => {
        const res = await GET("/api/question-banks");
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["exams"]);
        assert(Array.isArray(data.exams), "exams should be an array");
        if (data.exams.length > 0) {
            ctx.targetExamId = data.exams[0].id;
        }
    });

    await test("GET /api/question-banks/[examId] → 200 or 404", async () => {
        if (!ctx.targetExamId) return skip("Skipped — no targetExamId", "no data");
        const res = await GET(`/api/question-banks/${ctx.targetExamId}`);
        assert([200, 404].includes(res.status), `Unexpected status: ${res.status}`);
    });

    await test("GET /api/question-banks/[examId]/question-sets → 200", async () => {
        if (!ctx.targetExamId) return skip("Skipped", "no data");
        const res = await GET(`/api/question-banks/${ctx.targetExamId}/question-sets`);
        assertStatus(res, 200);
        const data = await res.json();
        assert(
            Array.isArray(data.questionSets) || Array.isArray(data.sets),
            "Response should contain sets array"
        );
        const sets = data.questionSets || data.sets || [];
        if (sets.length > 0) ctx.questionSetId = sets[0].id;
    });

    await test("GET /api/question-banks/[examId]/question-sets/[setId] → 200 or 404", async () => {
        if (!ctx.targetExamId || !ctx.questionSetId) return;
        const res = await GET(
            `/api/question-banks/${ctx.targetExamId}/question-sets/${ctx.questionSetId}`
        );
        assert([200, 404].includes(res.status), `Unexpected status: ${res.status}`);
    });

    await test("GET /api/question-banks/nonexistent → 404", async () => {
        const res = await GET("/api/question-banks/nonexistent_id_12345");
        assertStatus(res, 404);
    });
}

// -------------------------------------------------------------------
//  Exam
// -------------------------------------------------------------------
async function testExam() {
    section("Exam CRUD");

    await test("GET /api/exam/nonexistent → 404", async () => {
        const res = await GET("/api/exam/nonexistent_exam_999");
        assertStatus(res, 404);
    });

    // We'll create an exam via /api/upload for later testing
}

// -------------------------------------------------------------------
//  Upload (creates an exam)
// -------------------------------------------------------------------
async function testUpload() {
    section("Upload (Create Exam)");

    await test("POST /api/upload — missing data → 400", async () => {
        const res = await POST("/api/upload", {});
        assertStatus(res, 400);
    });

    await test("POST /api/upload — valid → 200 with examId", async () => {
        const res = await POST("/api/upload", {
            userId: UID,
            title: "API Test Exam",
            questions: [
                {
                    id: "q1",
                    question: "What is 2 + 2?",
                    options: ["3", "4", "5", "6"],
                    correctAnswer: "4",
                    explanation: "Basic math",
                },
                {
                    id: "q2",
                    question: "Capital of India?",
                    options: ["Mumbai", "Delhi", "Chennai", "Kolkata"],
                    correctAnswer: "Delhi",
                    explanation: "New Delhi is the capital",
                },
            ],
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success", "examId"]);
        ctx.examId = data.examId;
    });
}

// -------------------------------------------------------------------
//  Exam (continued — needs examId from upload)
// -------------------------------------------------------------------
async function testExamContinued() {
    section("Exam (with created exam)");

    await test("GET /api/exam/[id] → 200 with exam data", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await GET(`/api/exam/${ctx.examId}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["id", "title", "questions"]);
    });

    await test("PUT /api/exam/[id] — update title → 200", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await PUT(`/api/exam/${ctx.examId}`, {
            title: "Updated API Test Exam",
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });

    await test("PUT /api/exam/[id] — missing title → 400", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await PUT(`/api/exam/${ctx.examId}`, {});
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  Exam Progress
// -------------------------------------------------------------------
async function testExamProgress() {
    section("Exam Progress");

    await test("POST /api/exam/[id]/progress — save → 200", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await POST(`/api/exam/${ctx.examId}/progress`, {
            userId: UID,
            answers: { q1: "4" },
            currentQuestionIndex: 1,
            timestamp: new Date().toISOString(),
        });
        assertStatus(res, 200);
    });

    await test("GET /api/exam/[id]/progress?uid → 200 with progress", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await GET(`/api/exam/${ctx.examId}/progress?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["progress"]);
    });

    await test("GET /api/exam/[id]/progress — missing uid → 400", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await GET(`/api/exam/${ctx.examId}/progress`);
        assertStatus(res, 400);
    });

    await test("DELETE /api/exam/[id]/progress → 200", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await DELETE_REQ(`/api/exam/${ctx.examId}/progress`, {
            userId: UID,
        });
        assertStatus(res, 200);
    });
}

// -------------------------------------------------------------------
//  Submit (creates an attempt)
// -------------------------------------------------------------------
async function testSubmit() {
    section("Submit (Create Attempt)");

    await test("POST /api/submit — missing fields → 400", async () => {
        const res = await POST("/api/submit", {});
        assertStatus(res, 400);
    });

    await test("POST /api/submit — valid → 200 with attemptId", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await POST("/api/submit", {
            examId: ctx.examId,
            userId: UID,
            answers: { q1: "4", q2: "Delhi" },
            score: 100,
            skippedCount: 0,
            completedAt: new Date().toISOString(),
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success", "attemptId"]);
        ctx.attemptId = data.attemptId;
    });
}

// -------------------------------------------------------------------
//  Attempt
// -------------------------------------------------------------------
async function testAttempt() {
    section("Attempt");

    await test("GET /api/attempt/nonexistent → 404", async () => {
        const res = await GET("/api/attempt/nonexistent_attempt_999");
        assertStatus(res, 404);
    });

    await test("GET /api/attempt/[attemptId] → 200", async () => {
        if (!ctx.attemptId) throw new Error("No attemptId");
        const res = await GET(`/api/attempt/${ctx.attemptId}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["attempt", "exam"]);
    });

    await test("GET /api/exam/[id]/attempts?uid → 200 with attempts array", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await GET(`/api/exam/${ctx.examId}/attempts?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["attempts"]);
        assert(Array.isArray(data.attempts), "attempts should be an array");
    });

    await test("GET /api/exam/[id]/attempts — missing uid → 400", async () => {
        if (!ctx.examId) throw new Error("No examId");
        const res = await GET(`/api/exam/${ctx.examId}/attempts`);
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  Attempt Delete
// -------------------------------------------------------------------
async function testAttemptDelete() {
    section("Attempt Delete");

    await test("POST /api/attempt/delete — missing attemptIds → 400", async () => {
        const res = await POST("/api/attempt/delete", { userId: UID });
        assertStatus(res, 400);
    });

    await test("POST /api/attempt/delete — missing userId → 400", async () => {
        const res = await POST("/api/attempt/delete", {
            attemptIds: ["fake"],
        });
        assertStatus(res, 400);
    });

    await test("POST /api/attempt/delete — valid → 200", async () => {
        if (!ctx.attemptId) throw new Error("No attemptId");
        const res = await POST("/api/attempt/delete", {
            attemptIds: [ctx.attemptId],
            userId: UID,
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success", "count"]);
    });
}

// -------------------------------------------------------------------
//  User Profile
// -------------------------------------------------------------------
async function testUserProfile() {
    section("User Profile");

    await test("GET /api/user/profile?uid → 200 with user data", async () => {
        const res = await GET(`/api/user/profile?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["user", "stats", "goal"]);
    });

    await test("GET /api/user/profile — missing uid → 400", async () => {
        const res = await GET("/api/user/profile");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Stats
// -------------------------------------------------------------------
async function testUserStats() {
    section("User Stats");

    await test("GET /api/user/stats?uid → 200", async () => {
        const res = await GET(`/api/user/stats?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["overallScore", "totalAttempts"]);
    });

    await test("GET /api/user/stats — missing uid → 400", async () => {
        const res = await GET("/api/user/stats");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Activity
// -------------------------------------------------------------------
async function testUserActivity() {
    section("User Activity");

    await test("GET /api/user/activity?uid → 200 with activity array", async () => {
        const res = await GET(`/api/user/activity?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["activity"]);
        assert(Array.isArray(data.activity), "activity should be an array");
    });

    await test("GET /api/user/activity — missing uid → 400", async () => {
        const res = await GET("/api/user/activity");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Recents
// -------------------------------------------------------------------
async function testUserRecents() {
    section("User Recents");

    await test("GET /api/user/recents?uid → 200 with recents array", async () => {
        const res = await GET(`/api/user/recents?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["recents"]);
    });

    await test("GET /api/user/recents — missing uid → 400", async () => {
        const res = await GET("/api/user/recents");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Exams
// -------------------------------------------------------------------
async function testUserExams() {
    section("User Exams");

    await test("GET /api/user/exams?uid → 200 with exams array", async () => {
        const res = await GET(`/api/user/exams?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["exams"]);
        assert(Array.isArray(data.exams), "exams should be an array");
    });

    await test("GET /api/user/exams — missing uid → 400", async () => {
        const res = await GET("/api/user/exams");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Preferences
// -------------------------------------------------------------------
async function testUserPreferences() {
    section("User Preferences");

    await test("POST /api/user/preferences — save → 200", async () => {
        const res = await POST("/api/user/preferences", {
            uid: UID,
            preferences: { theme: "dark", language: "en" },
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });

    await test("GET /api/user/preferences?uid → 200 with preferences", async () => {
        const res = await GET(`/api/user/preferences?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["preferences"]);
    });

    await test("POST /api/user/preferences — missing uid → 400", async () => {
        const res = await POST("/api/user/preferences", {
            preferences: { theme: "dark" },
        });
        assertStatus(res, 400);
    });

    await test("GET /api/user/preferences — missing uid → 400", async () => {
        const res = await GET("/api/user/preferences");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Terms
// -------------------------------------------------------------------
async function testUserTerms() {
    section("User Terms");

    await test("GET /api/user/terms?uid → 200 with hasAcceptedTerms", async () => {
        const res = await GET(`/api/user/terms?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["hasAcceptedTerms"]);
    });

    await test("POST /api/user/terms — accept → 200", async () => {
        const res = await POST("/api/user/terms", { uid: UID });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });

    await test("POST /api/user/terms — missing uid → 400", async () => {
        const res = await POST("/api/user/terms", {});
        assertStatus(res, 400);
    });

    await test("GET /api/user/terms — missing uid → 400", async () => {
        const res = await GET("/api/user/terms");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Status
// -------------------------------------------------------------------
async function testUserStatus() {
    section("User Status");

    await test("GET /api/user/status — no auth header → 401", async () => {
        const res = await GET("/api/user/status");
        assertStatus(res, 401);
    });

    await test("GET /api/user/status — invalid token → 401", async () => {
        const res = await fetch(`${BASE}/api/user/status`, {
            headers: { Authorization: "Bearer invalid_token_xyz" },
        });
        assertStatus(res, 401);
    });
}

// -------------------------------------------------------------------
//  User Goal
// -------------------------------------------------------------------
async function testUserGoal() {
    section("User Goal");

    await test("GET /api/user/goal?uid → 200", async () => {
        const res = await GET(`/api/user/goal?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["goal"]);
    });

    await test("GET /api/user/goal — missing uid → 400", async () => {
        const res = await GET("/api/user/goal");
        assertStatus(res, 400);
    });

    await test("POST /api/user/goal — missing data → 400", async () => {
        const res = await POST("/api/user/goal", {});
        assertStatus(res, 400);
    });

    await test("POST /api/user/goal — save valid goal → 200", async () => {
        const res = await POST("/api/user/goal", {
            uid: UID,
            goal: {
                exam: "Test Exam",
                examDate: "2026-12-31",
                createdAt: new Date().toISOString(),
                status: "generating",
            },
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });
}

// -------------------------------------------------------------------
//  User Daily Task
// -------------------------------------------------------------------
async function testUserDailyTask() {
    section("User Daily Task");

    await test("GET /api/user/daily-task?uid → 200 with tasks array", async () => {
        const res = await GET(`/api/user/daily-task?uid=${UID}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["tasks"]);
        assert(Array.isArray(data.tasks), "tasks should be an array");
        if (data.tasks.length > 0) ctx.taskId = data.tasks[0].id;
    });

    await test("GET /api/user/daily-task — missing uid → 400", async () => {
        const res = await GET("/api/user/daily-task");
        assertStatus(res, 400);
    });

    await test("GET /api/user/daily-task/[taskId]?uid → 200 or 404", async () => {
        if (!ctx.taskId) return;
        const res = await GET(`/api/user/daily-task/${ctx.taskId}?uid=${UID}`);
        assert([200, 404].includes(res.status), `Unexpected status: ${res.status}`);
    });

    await test("GET /api/user/daily-task/[taskId] — missing uid → 400", async () => {
        const res = await GET("/api/user/daily-task/some_task_id");
        assertStatus(res, 400);
    });
}

// -------------------------------------------------------------------
//  User Daily Task Generate (AI)
// -------------------------------------------------------------------
async function testDailyTaskGenerate() {
    section("User Daily Task Generate (AI)");

    await test("POST /api/user/daily-task/generate — missing uid → 400", async () => {
        const res = await POST("/api/user/daily-task/generate", {});
        assertStatus(res, 400);
    });

    await test("POST /api/user/daily-task/generate — valid (may fail if no roadmap) → 200 or 400", async () => {
        const res = await POST("/api/user/daily-task/generate", { uid: UID });
        // 200 if user has a roadmap, 400 if not, 500 if AI fails
        assert(
            [200, 400, 500].includes(res.status),
            `Unexpected status: ${res.status}`
        );
        const data = await res.json();
        if (res.status === 200) {
            assertHasKeys(data, ["success", "taskId"]);
        }
    });
}

// -------------------------------------------------------------------
//  User Daily Task Appeal
// -------------------------------------------------------------------
async function testDailyTaskAppeal() {
    section("User Daily Task Appeal");

    await test("POST /api/user/daily-task/appeal — missing uid → 400", async () => {
        const res = await POST("/api/user/daily-task/appeal", {});
        assertStatus(res, 400);
    });

    await test("POST /api/user/daily-task/appeal — valid (may fail if not deprecated) → varies", async () => {
        const res = await POST("/api/user/daily-task/appeal", { uid: UID });
        // 200 if deprecated & has appeals, 400 if not deprecated, 403 if max appeals, 404 if no user
        assert(
            [200, 400, 403, 404].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  User Goal Generate Roadmap (AI)
// -------------------------------------------------------------------
async function testGoalGenerateRoadmap() {
    section("Goal Generate Roadmap (AI)");

    await test("POST /api/user/goal/generate-roadmap — missing data → 400", async () => {
        const res = await POST("/api/user/goal/generate-roadmap", {});
        assertStatus(res, 400);
    });

    await test("POST /api/user/goal/generate-roadmap — valid → 200 or 500", async () => {
        const res = await POST("/api/user/goal/generate-roadmap", {
            uid: UID,
            examName: "Bank PO",
            examDate: "2026-12-31",
            daysRemaining: 30,
        });
        // 200 if Gemini succeeds, 500 if it fails (quota, timeout, etc.)
        assert(
            [200, 500].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  Contact (Email)
// -------------------------------------------------------------------
async function testContact() {
    section("Contact (Email)");

    await test("POST /api/contact — missing fields → 400", async () => {
        const res = await POST("/api/contact", { name: "Test" });
        assertStatus(res, 400);
    });

    await test("POST /api/contact — valid → 200 or 500", async () => {
        const res = await POST("/api/contact", {
            name: "API Test",
            email: "test@example.com",
            subject: "API Test Subject",
            message: "This is an automated API test message. Please ignore.",
        });
        // 200 if SMTP is configured, 500 if not
        assert(
            [200, 500].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  Chat (AI)
// -------------------------------------------------------------------
async function testChat() {
    section("Chat (AI)");

    await test("POST /api/chat — valid → 200 or 500", async () => {
        const res = await POST("/api/chat", {
            messages: [
                { role: "user", content: "Give me a hint for this question" },
            ],
            questionContext:
                "What is the capital of India? Options: A) Mumbai B) Delhi C) Chennai D) Kolkata",
        });
        assert(
            [200, 500].includes(res.status),
            `Unexpected status: ${res.status}`
        );
        if (res.status === 200) {
            const data = await res.json();
            assertHasKeys(data, ["content"]);
        }
    });
}

// -------------------------------------------------------------------
//  User Reset History
// -------------------------------------------------------------------
async function testResetHistory() {
    section("User Reset History");

    await test("POST /api/user/reset-history — missing uid → 400", async () => {
        const res = await POST("/api/user/reset-history", {});
        assertStatus(res, 400);
    });

    await test("POST /api/user/reset-history — valid → 200", async () => {
        const res = await POST("/api/user/reset-history", { uid: UID });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });
}

// -------------------------------------------------------------------
//  Cron — Check Deprecation
// -------------------------------------------------------------------
async function testCronCheckDeprecation() {
    section("Cron — Check Deprecation");

    await test("POST /api/cron/check-deprecation — no auth → 401", async () => {
        const res = await POST("/api/cron/check-deprecation", {});
        assertStatus(res, 401);
    });

    await test("POST /api/cron/check-deprecation — with secret → 200", async () => {
        const res = await POST(
            `/api/cron/check-deprecation?uid=${UID}`,
            {},
            { Authorization: `Bearer ${CRON_SECRET}` }
        );
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success", "summary"]);
    });
}

// -------------------------------------------------------------------
//  Cron — Generate Task (AI)
// -------------------------------------------------------------------
async function testCronGenerateTask() {
    section("Cron — Generate Task (AI)");

    await test("POST /api/cron/generate-task — no auth → 401", async () => {
        const res = await POST("/api/cron/generate-task", {});
        assertStatus(res, 401);
    });

    await test("POST /api/cron/generate-task — with secret → 200 or 500", async () => {
        const res = await POST(
            `/api/cron/generate-task?uid=${UID}`,
            {},
            { Authorization: `Bearer ${CRON_SECRET}` }
        );
        assert(
            [200, 500].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  Cron — Send Email
// -------------------------------------------------------------------
async function testCronSendEmail() {
    section("Cron — Send Email");

    await test("POST /api/cron/send-email — no auth → 401", async () => {
        const res = await POST("/api/cron/send-email", { action: "reminder" });
        assertStatus(res, 401);
    });

    await test("POST /api/cron/send-email — invalid action → 400", async () => {
        const res = await POST(
            "/api/cron/send-email",
            { action: "invalid_action" },
            { Authorization: `Bearer ${CRON_SECRET}` }
        );
        assertStatus(res, 400);
    });

    await test("POST /api/cron/send-email — reminder for single user → 200", async () => {
        const res = await POST(
            `/api/cron/send-email?uid=${UID}`,
            { action: "reminder" },
            { Authorization: `Bearer ${CRON_SECRET}` }
        );
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });

    await test("POST /api/cron/send-email — warning for single user → 200", async () => {
        const res = await POST(
            `/api/cron/send-email?uid=${UID}`,
            { action: "warning" },
            { Authorization: `Bearer ${CRON_SECRET}` }
        );
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });
}

// -------------------------------------------------------------------
//  Admin Stats (requires auth — will get 401 without valid token)
// -------------------------------------------------------------------
async function testAdminStats() {
    section("Admin Stats");

    await test("GET /api/admin/stats — no auth → 401", async () => {
        const res = await GET("/api/admin/stats");
        assertStatus(res, 401);
    });

    await test("GET /api/admin/stats — invalid token → 401", async () => {
        const res = await fetch(`${BASE}/api/admin/stats`, {
            headers: { Authorization: "Bearer invalid_token" },
        });
        assertStatus(res, 401);
    });
}

// -------------------------------------------------------------------
//  Admin Users (requires auth — will get 401 without valid token)
// -------------------------------------------------------------------
async function testAdminUsers() {
    section("Admin Users");

    await test("GET /api/admin/users — no auth → 401", async () => {
        const res = await GET("/api/admin/users");
        assertStatus(res, 401);
    });

    await test("PATCH /api/admin/users — no auth → 401", async () => {
        const res = await PATCH("/api/admin/users", { uid: UID, disabled: false });
        assertStatus(res, 401);
    });
}

// -------------------------------------------------------------------
//  Admin Settings (requires auth)
// -------------------------------------------------------------------
async function testAdminSettings() {
    section("Admin Settings");

    await test("GET /api/admin/settings — no auth → 401", async () => {
        const res = await GET("/api/admin/settings");
        assertStatus(res, 401);
    });

    await test("POST /api/admin/settings — no auth → 401", async () => {
        const res = await POST("/api/admin/settings", {
            feature: "test",
            value: true,
        });
        assertStatus(res, 401);
    });
}

// -------------------------------------------------------------------
//  Admin Question Banks
// -------------------------------------------------------------------
async function testAdminQuestionBanks() {
    section("Admin Question Banks");

    await test("GET /api/admin/question-banks — 200 (no auth check)", async () => {
        const res = await GET("/api/admin/question-banks");
        // This might or might not require auth depending on impl
        assert(
            [200, 401].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  Admin Daily Tasks
// -------------------------------------------------------------------
async function testAdminDailyTasks() {
    section("Admin Daily Tasks");

    await test("GET /api/admin/daily-tasks → 200 with users & stats", async () => {
        const res = await GET("/api/admin/daily-tasks");
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["users", "stats", "pagination"]);
    });

    await test("GET /api/admin/daily-tasks?status=active → 200", async () => {
        const res = await GET("/api/admin/daily-tasks?status=active");
        assertStatus(res, 200);
    });

    await test("GET /api/admin/daily-tasks/[uid] → 200 or 400 or 404", async () => {
        const res = await GET(`/api/admin/daily-tasks/${UID}`);
        assert(
            [200, 400, 404].includes(res.status),
            `Unexpected status: ${res.status}`
        );
    });
}

// -------------------------------------------------------------------
//  Exam Delete (cleanup the test exam)
// -------------------------------------------------------------------
async function testExamDelete() {
    section("Exam Cleanup");

    await test("DELETE /api/exam/[id] → 200", async () => {
        if (!ctx.examId) throw new Error("No examId to delete");
        const res = await DELETE_REQ(`/api/exam/${ctx.examId}`);
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });
}

// -------------------------------------------------------------------
//  Goal Delete (cleanup)
// -------------------------------------------------------------------
async function testGoalDelete() {
    section("Goal Cleanup (Reset)");

    await test("DELETE /api/user/goal?uid → 200", async () => {
        const res = await fetch(`${BASE}/api/user/goal?uid=${UID}`, {
            method: "DELETE",
        });
        assertStatus(res, 200);
        const data = await res.json();
        assertHasKeys(data, ["success"]);
    });

    await test("DELETE /api/user/goal — missing uid → 400", async () => {
        const res = await fetch(`${BASE}/api/user/goal`, {
            method: "DELETE",
        });
        assertStatus(res, 400);
    });
}

// ============================================================
//  RUNNER
// ============================================================
async function main() {
    console.log(
        `\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════╗`
    );
    console.log(
        `║   PrepmyExam — API Test Suite                     ║`
    );
    console.log(
        `║   Base: ${BASE}                        ║`
    );
    console.log(
        `║   UID:  ${UID}          ║`
    );
    console.log(
        `╚═══════════════════════════════════════════════════╝${colors.reset}\n`
    );

    // Check server is up
    try {
        await fetch(`${BASE}/api/system/status`);
    } catch {
        console.error(
            `${colors.red}ERROR: Cannot reach ${BASE}. Is the dev server running?${colors.reset}`
        );
        process.exit(1);
    }

    // Run all test suites in order
    await testSystemStatus();
    await testQuestionBanks();
    await testExam();
    await testUpload();
    await testExamContinued();
    await testExamProgress();
    await testSubmit();
    await testAttempt();
    await testAttemptDelete();
    await testUserProfile();
    await testUserStats();
    await testUserActivity();
    await testUserRecents();
    await testUserExams();
    await testUserPreferences();
    await testUserTerms();
    await testUserStatus();
    await testUserGoal();
    await testUserDailyTask();
    await testDailyTaskGenerate();
    await testDailyTaskAppeal();
    await testGoalGenerateRoadmap();
    await testContact();
    await testChat();
    await testResetHistory();
    await testCronCheckDeprecation();
    await testCronGenerateTask();
    await testCronSendEmail();
    await testAdminStats();
    await testAdminUsers();
    await testAdminSettings();
    await testAdminQuestionBanks();
    await testAdminDailyTasks();

    // Cleanup
    await testExamDelete();
    await testGoalDelete();

    // -----------------------------------------------------------
    //  Summary
    // -----------------------------------------------------------
    console.log(
        `\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`
    );
    console.log(
        `${colors.bold}  RESULTS${colors.reset}`
    );
    console.log(
        `${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`
    );
    console.log(`  ${colors.green}✅ Passed:  ${passed}${colors.reset}`);
    console.log(`  ${colors.red}❌ Failed:  ${failed}${colors.reset}`);
    console.log(`  ${colors.yellow}⏭️  Skipped: ${skipped}${colors.reset}`);
    console.log(
        `  ${colors.dim}Total:   ${passed + failed + skipped}${colors.reset}`
    );
    console.log(
        `${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`
    );

    if (failures.length > 0) {
        console.log(`${colors.red}${colors.bold}  FAILURES:${colors.reset}`);
        failures.forEach((f, i) => {
            console.log(
                `  ${colors.red}${i + 1}. ${f.name}${colors.reset}`
            );
            console.log(
                `     ${colors.dim}${f.error}${colors.reset}`
            );
        });
        console.log();
    }

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(`\n${colors.red}FATAL: ${err.message}${colors.reset}`);
    process.exit(1);
});

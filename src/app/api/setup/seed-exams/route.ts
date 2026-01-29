import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const EXAMS = [
    { title: "Bank PO", description: "Probationary Officer exams for various public sector banks.", latestNews: "IBPS PO Notification expected soon" },
    { title: "SBI Clerk", description: "Junior Associate positions in State Bank of India.", latestNews: "Result declared for Prelims" },
    { title: "IBPS RRB", description: "Officer and Office Assistant posts in Regional Rural Banks.", latestNews: "Admit cards released" },
    { title: "SSC CGL", description: "Combined Graduate Level Examination for Group B and C posts.", latestNews: "Tier 1 Answer Key out" },
    { title: "UPSC CSE", description: "Civil Services Examination for IAS, IPS, IFS, etc.", latestNews: "Mains schedule published" },
    { title: "Railways NTPC", description: "Non-Technical Popular Categories in Indian Railways.", latestNews: "Phase 2 exam dates announced" },
    { title: "SSC CHSL", description: "Combined Higher Secondary Level 10+2 Examination.", latestNews: "Application window closing soon" },
    { title: "SSC MTS", description: "Multi Tasking (Non-Technical) Staff Examination.", latestNews: "" },
    { title: "RBI Grade B", description: "Direct Recruitment for Grade B Officers in RBI.", latestNews: "Phase 1 admit card out" },
    { title: "LIC AAO", description: "Assistant Administrative Officer in Life Insurance Corporation.", latestNews: "" },
    { title: "IBPS Clerk", description: "Clerical cadre posts in participating banks.", latestNews: "" },
    { title: "SBI PO", description: "Probationary Officer vacancy in State Bank of India.", latestNews: "" },
    { title: "TNPSC Group 1", description: "Top-tier Tamil Nadu Public Service Commission exams.", latestNews: "" },
    { title: "TNPSC Group 2", description: "Group 2 and 2A Services in Tamil Nadu.", latestNews: "" },
    { title: "TNPSC Group 4", description: "Village Administrative Officer and other posts.", latestNews: "" },
    { title: "GATE", description: "Graduate Aptitude Test in Engineering.", latestNews: "" },
    { title: "CAT", description: "Common Admission Test for MBA aspirants.", latestNews: "" },
    { title: "UPSC CDS", description: "Combined Defence Services Examination.", latestNews: "" },
    { title: "UPSC EPFO", description: "Enforcement Officer/Accounts Officer in EPFO.", latestNews: "" }
];

export async function GET() {
    try {
        const batch = adminDb.batch();
        const collectionRef = adminDb.collection("target_exams");

        // Check for existing to avoid duplicates or valid IDs
        const snapshot = await collectionRef.get();
        if (snapshot.empty) {
            EXAMS.forEach(exam => {
                const docRef = collectionRef.doc(); // Auto-ID
                batch.set(docRef, {
                    ...exam,
                    createdAt: FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            return NextResponse.json({ success: true, message: `Seeded ${EXAMS.length} exams` });
        }

        // Merge logic if needed, but for now let's just add missing ones or skip if populated
        // A simple brute force "ensure exists" logic:

        let addedCount = 0;
        for (const exam of EXAMS) {
            // Check if title exists
            const exists = snapshot.docs.find(d => d.data().title === exam.title);
            if (!exists) {
                const docRef = collectionRef.doc();
                batch.set(docRef, {
                    ...exam,
                    createdAt: FieldValue.serverTimestamp()
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, message: `Seeded/Updated exams. Added: ${addedCount}` });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
    }
}

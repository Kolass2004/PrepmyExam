import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const examsSnapshot = await adminDb
            .collection("exams")
            .where("userId", "==", uid)
            .limit(1)
            .get();

        return NextResponse.json({ hasExams: !examsSnapshot.empty });
    } catch (error) {
        console.error("Error checking user status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

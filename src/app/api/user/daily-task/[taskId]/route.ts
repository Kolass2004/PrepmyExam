
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ taskId: string }> }
) {
    const params = await props.params;
    const { taskId } = params;

    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid || !taskId) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const taskDoc = await adminDb
            .collection("users")
            .doc(uid)
            .collection("daily_tasks")
            .doc(taskId)
            .get();

        if (!taskDoc.exists) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const data = taskDoc.data();

        // Ensure format is compatible with QuestionSet interface if needed
        return NextResponse.json({
            id: taskDoc.id,
            title: data?.title,
            questions: data?.questions,
            ...data
        });

    } catch (error) {
        console.error("Error fetching daily task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ taskId: string }> }
) {
    const params = await props.params;
    const { taskId } = params;

    // We expect uid in searchParams just like GET
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");

    if (!uid || !taskId) {
        return NextResponse.json({ error: "Missing uid or taskId" }, { status: 400 });
    }

    try {
        await adminDb
            .collection("users")
            .doc(uid)
            .collection("daily_tasks")
            .doc(taskId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting daily task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

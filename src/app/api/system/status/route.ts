import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        const doc = await adminDb.collection("system").doc("features").get();
        const features = doc.data() || {};
        // Explicitly return only public info
        return NextResponse.json({
            maintenanceMode: features.maintenanceMode || false
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

import { ExamContainer } from "@/components/exam/ExamContainer";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            }>
                <ExamContainer examId={id} />
            </Suspense>
        </div>
    );
}

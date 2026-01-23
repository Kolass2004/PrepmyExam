"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// We need to fetch the attempt AND the original exam questions.
// Ideally the attempt stores snapshot of answers, and we combine with exam.

export default function ExamReviewPage() {
    const { attemptId } = useParams(); // Need to adjust route to be /exam-review/[attemptId]
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !attemptId) return;
        async function load() {
            try {
                // Fetch attempt details (which should include examId)
                // Then fetch exam details.
                // Or create a specific API returning full review data.
                const res = await fetch(`/api/attempt/${attemptId}`); // Need to create this API
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [attemptId, user]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
    if (!data) return <div className="text-white text-center p-10">Attempt not found</div>;

    if (data?.error || !data?.exam) return <div className="text-white text-center p-10">Error: {data?.error || "Exam data missing"}</div>;

    const { attempt, exam } = data;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-500">
            <Link href={`/exam-dashboard/${exam.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors px-4 py-2 hover:bg-secondary rounded-full">
                <ArrowLeft className="w-4 h-4" /> Back to Exam Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Review: {exam.title}</h1>
                <p className="text-muted-foreground text-lg">Score: {attempt.score.toFixed(1)}% • {new Date(attempt.completedAt).toLocaleDateString()}</p>
            </header>

            <div className="space-y-8 max-w-4xl mx-auto">
                {exam.questions.map((q: any, idx: number) => {
                    const userAnswer = attempt.answers[idx];
                    // Handle different key naming (correct_answer vs correctAnswer)
                    const correctVal = q.correct_answer || q.correctAnswer;
                    const isCorrect = userAnswer === correctVal;

                    return (
                        <div key={idx} className={`p-8 rounded-[2rem] border-0 shadow-sm ${isCorrect ? 'bg-green-500/10 dark:bg-green-900/20' : 'bg-red-500/10 dark:bg-red-900/20'}`}>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="mt-1 p-2 bg-background/50 rounded-full">
                                    {isCorrect ? <CheckCircle2 className="text-green-600 dark:text-green-400 w-6 h-6" /> : <XCircle className="text-red-600 dark:text-red-400 w-6 h-6" />}
                                </div>
                                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question || q.content}</ReactMarkdown>
                                </div>
                            </div>

                            <div className="pl-14 space-y-3">
                                <p className="text-base text-muted-foreground">Your Answer: <span className={isCorrect ? "text-green-600 dark:text-green-400 font-bold text-lg ml-2" : "text-red-600 dark:text-red-400 font-bold text-lg ml-2"}>{q.options[userAnswer] || "Skipped"}</span></p>
                                {!isCorrect && (
                                    <p className="text-base text-muted-foreground">Correct Answer: <span className="text-green-600 dark:text-green-400 font-bold text-lg ml-2">{q.options[correctVal]}</span></p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

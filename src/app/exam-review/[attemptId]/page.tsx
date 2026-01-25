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

import { useLanguage } from "@/context/LanguageContext";

// ... imports

export default function ExamReviewPage() {
    const { attemptId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !attemptId) {
            setLoading(false);
            return;
        }

        async function load() {
            try {
                const res = await fetch(`/api/attempt/${attemptId}`);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [attemptId, user, authLoading]);

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

    if (!user) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <p className="text-foreground">Please log in to view this attempt.</p>
                <Link href="/auth" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Login</Link>
            </div>
        );
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
    if (!data) return <div className="text-foreground text-center p-10">Attempt not found</div>;

    if (data?.error || !data?.exam) return <div className="text-destructive text-center p-10">Error: {data?.error || "Exam data missing"}</div>;

    const { attempt, exam } = data;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-500">
            <Link href={`/exam-dashboard/${exam.id}`} className="inline-flex items-center gap-2 text-muted-foreground text-primary mb-8 transition-colors px-4 py-2 bg-secondary rounded-full">
                <ArrowLeft className="w-4 h-4" /> {t('back_dashboard')}
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">{t('review_title')} {exam.title}</h1>
                <p className="text-muted-foreground text-lg">{t('score')} {attempt.score.toFixed(1)}% • {new Date(attempt.completedAt).toLocaleDateString()}</p>
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
                                <p className="text-base text-muted-foreground">{t('your_answer')} <span className={isCorrect ? "text-green-600 dark:text-green-400 font-bold text-lg ml-2" : "text-red-600 dark:text-red-400 font-bold text-lg ml-2"}>{q.options[userAnswer] || t('skipped')}</span></p>
                                {!isCorrect && (
                                    <p className="text-base text-muted-foreground">{t('correct_answer')} <span className="text-green-600 dark:text-green-400 font-bold text-lg ml-2">{q.options[correctVal]}</span></p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

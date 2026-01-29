"use client";

import { useEffect, useState, use } from "react";
import { Loader2, ArrowLeft, Play, BookOpen, Clock, AlertCircle, Sparkles, Newspaper } from "lucide-react";
import Link from "next/link";
import { TargetExam, QuestionSet } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function ExamDetailPage(props: { params: Promise<{ examId: string }> }) {
    const params = use(props.params);
    const { examId } = params;
    const { t } = useLanguage();

    const router = useRouter();
    const [exam, setExam] = useState<TargetExam | null>(null);
    const [sets, setSets] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Exam
                const examRes = await fetch(`/api/question-banks/${examId}`);
                if (examRes.ok) {
                    setExam(await examRes.json());
                } else {
                    router.push("/question-banks");
                }

                // Fetch Sets
                const setsRes = await fetch(`/api/question-banks/${examId}/question-sets`);
                if (setsRes.ok) {
                    const data = await setsRes.json();
                    setSets(data.sets || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [examId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 transition-colors duration-500">
            {/* Header Section */}
            <div className="w-full space-y-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <Link
                        href="/question-banks"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/80 hover:bg-secondary text-foreground font-medium transition-all group mb-8"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-primary" />
                        Back to Banks
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div className="space-y-6 max-w-4xl">
                            <div className="flex items-start gap-6">
                                <div className="hidden md:flex w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center text-primary shrink-0">
                                    <BookOpen className="w-10 h-10" />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-balance">
                                        {exam.title}
                                    </h1>
                                    <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                                        {exam.description}
                                    </p>
                                </div>
                            </div>

                            {exam.latestNews && (
                                <div className="inline-flex items-start gap-3 bg-card border border-border/50 p-4 rounded-2xl max-w-2xl animate-pulse-slow">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-1">Latest News</h3>
                                        <p className="text-sm font-medium opacity-90">{exam.latestNews}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats or Fast Action */}
                        <div className="p-6 bg-card border-0 shadow-sm rounded-[2rem] min-w-[280px]">
                            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-4">Total Sets Available</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-foreground">{sets.length}</span>
                                <span className="text-xl text-muted-foreground font-medium">Papers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Available Question Sets
                </h2>

                {sets.length === 0 ? (
                    <div className="text-center py-32 bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                            <BookOpen className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No question sets uploaded yet</h3>
                        <p className="text-muted-foreground">Check back later or explore other question banks.</p>
                        <Link href="/question-banks" className="inline-block mt-6 text-primary font-bold hover:underline">
                            Explore other exams
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sets.map((set, idx) => (
                            <div
                                key={set.id}
                                style={{ animationDelay: `${idx * 100}ms`, animationDuration: "700ms" }}
                                className="group relative bg-card hover:bg-secondary/40 border-0 shadow-sm hover:shadow-xl rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            >
                                <div className="absolute top-6 right-6">
                                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-45">
                                        <ArrowLeft className="w-5 h-5 rotate-[135deg]" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                                        <Clock className="w-3 h-3" /> Practice Set
                                    </span>
                                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                        {set.title}
                                    </h3>
                                </div>

                                <div className="mt-auto space-y-6">
                                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-secondary rounded-md">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            {set.questions.length} Questions
                                        </div>
                                    </div>

                                    <Link
                                        href={`/question-banks/${examId}/attempt/${set.id}`}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Start Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

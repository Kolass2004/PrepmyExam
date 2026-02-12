"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { TargetExam } from "@/lib/types";

export function QuestionBanksWidget({ className }: { className?: string }) {
    const { t } = useLanguage();
    const [exams, setExams] = useState<TargetExam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/question-banks?limit=4")
            .then(res => res.json())
            .then(data => {
                if (data.exams) setExams(data.exams.slice(0, 4));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={cn("rounded-[2rem] bg-card p-8 border border-border/50 flex flex-col justify-center gap-4", className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
                    <div className="h-6 w-32 bg-secondary rounded animate-pulse" />
                </div>
                <div className="h-32 bg-secondary/30 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className={cn("rounded-[2rem] bg-card p-6 md:p-8 border border-border/50 flex flex-col", className)}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{t('question_banks')}</h3>
                </div>
                <Link
                    href="/question-banks"
                    className="p-2 bg-secondary hover:bg-secondary/80 rounded-full transition-colors group"
                    title="View All"
                >
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {exams.map((exam, i) => (
                    <Link
                        key={exam.id}
                        href={`/question-banks/${exam.id}`}
                        className="group relative p-4 rounded-2xl bg-card dark:bg-secondary/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary line-clamp-1 bg-primary/10 px-2 py-1 rounded-md">{exam.title.split(' ')[0]}</span>
                            
                        </div>

                        <div>
                            <h4 className="font-bold text-foreground line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{exam.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">View Details</p>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                href="/question-banks"
                className="mt-6 w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm rounded-xl flex items-center justify-center transition-colors"
            >
                Browse All Banks
            </Link>
        </div>
    );
}

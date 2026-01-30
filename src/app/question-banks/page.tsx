"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, ArrowLeft, Newspaper, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { TargetExam } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function QuestionBanksListingPage() {
    const { t } = useLanguage();
    const [exams, setExams] = useState<TargetExam[]>([]);
    const [filteredExams, setFilteredExams] = useState<TargetExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchExams() {
            try {
                const res = await fetch("/api/question-banks");
                if (res.ok) {
                    const data = await res.json();
                    setExams(data.exams || []);
                    setFilteredExams(data.exams || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchExams();
    }, []);

    useEffect(() => {
        const filtered = exams.filter(exam =>
            exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredExams(filtered);
    }, [searchQuery, exams]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 transition-colors duration-500">
            {/* Header Section */}
            <div className="w-full space-y-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/80 hover:bg-secondary text-foreground font-medium transition-all group mb-6"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-primary" />
                            {t('back_dashboard')}
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            {t('question_banks')} <Sparkles className="inline-block w-8 h-8 text-primary mb-2 animate-pulse" />
                        </h1>
                        <p className="text-xl text-muted-foreground mt-2 max-w-2xl">
                            {t('question_banks_desc')}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_exams')}
                            className="w-full pl-11 pr-4 py-4 rounded-full bg-secondary/50 border-0 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters or Categories could go here */}
            </div>

            {/* Grid */}
            <div className="w-full">
                {filteredExams.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/20 rounded-[2.5rem] border border-dashed border-border animate-in fade-in zoom-in-95 duration-500">
                        <p className="text-muted-foreground text-lg">{t('no_question_banks_found')}</p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 text-primary font-bold hover:underline"
                        >
                            {t('clear_search')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredExams.map((exam, index) => (
                            <Link
                                href={`/question-banks/${exam.id}`}
                                key={exam.id}
                                className={cn(
                                    "group relative bg-card hover:bg-secondary/40 border-0 shadow-sm hover:shadow-xl rounded-[2rem] p-6 transition-all duration-300 flex flex-col h-full overflow-hidden",
                                    "animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                                )}
                                style={{ animationDelay: `${index * 100}ms`, animationDuration: "700ms" }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                    <div className="p-2 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                                        <ArrowLeft className="w-5 h-5 rotate-180 text-foreground" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors tracking-tight">
                                    {exam.title}
                                </h3>

                                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow">
                                    {exam.description || t('default_exam_desc')}
                                </p>

                                {exam.latestNews && (
                                    <div className="mt-auto pt-4 border-t border-border/50">
                                        <div className="flex items-start gap-2 text-xs font-semibold text-primary/80 bg-primary/5 p-3 rounded-xl">
                                            <Newspaper className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{exam.latestNews}</span>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

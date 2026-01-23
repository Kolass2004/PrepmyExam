"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, PlayCircle, History, ArrowLeft, Trophy, RotateCcw, Trash2, CheckSquare, Square, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatIndianDate } from "@/lib/utils";

interface Attempt {
    id: string;
    score: number;
    completedAt: string;
    status: string;
    skippedCount?: number;
}

interface ExamDetails {
    id: string;
    title: string;
    questionCount: number;
}

export default function ExamDashboardPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [exam, setExam] = useState<ExamDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasProgress, setHasProgress] = useState(false);

    // Deletion State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!user || !id) return;

        async function loadData() {
            try {
                // Fetch Exam Details
                const examRes = await fetch(`/api/exam/${id}`);
                const examData = await examRes.json();
                setExam(examData);

                // Fetch Attempts
                const attemptsRes = await fetch(`/api/exam/${id}/attempts?uid=${user?.uid}`);
                const attemptsData = await attemptsRes.json();
                setAttempts(attemptsData.attempts || []);

                // Check Progress
                const progRes = await fetch(`/api/exam/${id}/progress?uid=${user?.uid}`);
                const progData = await progRes.json();
                if (progData.progress) {
                    setHasProgress(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, user]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const toggleSelection = (attemptId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(attemptId)) {
            newSelected.delete(attemptId);
        } else {
            newSelected.add(attemptId);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === attempts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(attempts.map(a => a.id)));
        }
    };

    const deleteSelected = async () => {
        if (!confirm(`Permanently delete ${selectedIds.size} attempts?`)) return;
        setIsDeleting(true);
        try {
            const res = await fetch("/api/attempt/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptIds: Array.from(selectedIds),
                    userId: user?.uid
                })
            });

            if (res.ok) {
                // Remove from local state
                setAttempts(prev => prev.filter(a => !selectedIds.has(a.id)));
                setSelectedIds(new Set());
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete attempts");
        } finally {
            setIsDeleting(false);
        }
    };

    const bestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score), 0);

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 transition-colors duration-500">
            <Link href="/" className="inline-flex items-center gap-2 hover:text-muted-foreground text-primary mb-8 transition-colors px-4 py-2 bg-secondary rounded-full">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-bold hover:text-foreground mb-2 tracking-tight">{exam?.title || "Exam Details"}</h1>
                <p className="text-muted-foreground text-lg">{exam?.questionCount} Questions • {attempts.length} Attempts</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-0 p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50" />
                <div className="flex items-center justify-between">
                       <Trophy className="w-25 h-25 text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col  gap-3 mb-2 relative">
                       
                        <h3 className="text-amber-700 dark:text-amber-300 text-xl font-bold uppercase tracking-wider">Best Score</h3>
                        <p className="text-6xl font-bold text-foreground relative">{bestScore.toFixed(1)}<span className="text-3xl text-muted-foreground ml-1">%</span></p>
                    </div>
                    
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 bg-card border-0 p-8 rounded-[2rem] shadow-sm elevation-1 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            {hasProgress ? "Continue where you left off?" : "Ready to practice?"}
                        </h3>
                        <p className="text-muted-foreground">
                            {hasProgress ? "You have an unfinished session." : "Start a new session to improve your score."}
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        {hasProgress ? (
                            <>
                                <button
                                    onClick={async () => {
                                        if (!confirm("Discard saved progress?")) return;
                                        setLoading(true);
                                        await fetch(`/api/exam/${id}/progress`, {
                                            method: "DELETE",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ userId: user?.uid })
                                        });
                                        window.location.reload();
                                    }}
                                    className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-full font-medium transition-colors"
                                >
                                    Discard
                                </button>
                                <Link href={`/exam/${id}`} className="flex-1 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                    <RotateCcw className="w-5 h-5" /> Resume
                                </Link>
                            </>
                        ) : (
                            <Link href={`/exam/${id}`} className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                <PlayCircle className="w-5 h-5" /> Start Test
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <History className="w-6 h-6 text-muted-foreground" /> Recent Attempts
                    </h2>

                    {attempts.length > 0 && (
                        <div className="flex items-center gap-2">
                            {selectedIds.size > 0 ? (
                                <div className="flex items-center gap-2 bg-secondary p-1 rounded-full pl-4">
                                    <span className="text-foreground text-sm font-medium hidden md:inline">{selectedIds.size} selected</span>
                                    <button
                                        onClick={deleteSelected}
                                        disabled={isDeleting}
                                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded-full text-sm font-medium transition-all shadow-sm"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-background transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={toggleAll}
                                    className="px-4 py-2 text-primary font-medium hover:bg-primary/5 rounded-full transition-colors"
                                >
                                    Select All
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-4">
                    {attempts.length === 0 ? (
                        <div className="p-12 border border-dashed border-border rounded-[2rem] text-center text-muted-foreground bg-card/50">
                            No attempts yet. Start your first test!
                        </div>
                    ) : (
                        attempts.map(attempt => {
                            const isSelected = selectedIds.has(attempt.id);
                            return (
                                <div key={attempt.id}
                                    onClick={() => isSelected ? toggleSelection(attempt.id) : null}
                                    className={`group bg-card border-0 p-6 rounded-[24px] flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(attempt.id);
                                            }}
                                            className={`p-2 rounded-full transition-colors ${isSelected ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary'}`}
                                        >
                                            {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                        </button>

                                        <Link href={attempt.status === "paused" ? `/exam/${id}` : `/exam-review/${attempt.id}`} className="block">
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="text-foreground font-medium text-lg">{formatIndianDate(attempt.completedAt)}</p>
                                                {attempt.status === "paused" && (
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase rounded-full">
                                                        Paused
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                    <Link href={attempt.status === "paused" ? `/exam/${id}` : `/exam-review/${attempt.id}`} className="text-right pl-4">
                                        {attempt.status === "paused" ? (
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                                Question {(attempt as any).currentQuestionIndex + 1}
                                            </p>
                                        ) : (
                                            <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">{attempt.score.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
                                        )}
                                        <div className="flex flex-col items-end mt-1">
                                            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">{attempt.status}</p>
                                            {attempt.skippedCount !== undefined && attempt.skippedCount > 0 && (
                                                <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-bold uppercase rounded-md">
                                                    Skipped: {attempt.skippedCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}

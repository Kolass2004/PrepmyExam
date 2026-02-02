
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Target, ArrowRight, Sparkles, BookOpen, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { UserGoal } from "@/lib/types";
import { differenceInDays } from "date-fns";
import { CalendarSync } from "./CalendarSync";

export default function MyGoalPage() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();

    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);

    async function fetchGoal() {
        if (!user) return;
        try {
            const res = await fetch(`/api/user/goal?uid=${user.uid}`);
            const data = await res.json();
            setGoal(data.goal);
        } catch (error) {
            console.error("Failed to fetch goal:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchGoal();
    }, [user]);

    // Polling for generating status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (goal?.status === 'generating') {
            interval = setInterval(fetchGoal, 3000);
        }
        return () => clearInterval(interval);
    }, [goal?.status]);

    const handleWeekSelect = (week: number) => {
        const element = document.getElementById(`week-card-${week}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add a temporary highlight flash
            element.classList.add('ring-2', 'ring-primary', 'scale-[1.02]');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-primary', 'scale-[1.02]');
            }, 1000);
        }
    };

    const confirmResetGoal = async () => {
        if (!user) return;

        try {
            setResetting(true);
            const res = await fetch(`/api/user/goal?uid=${user.uid}`, { method: 'DELETE' });
            if (res.ok) {
                setGoal(null);
                setShowResetModal(false);
            }
        } catch (error) {
            console.error("Failed to reset goal:", error);
        } finally {
            setResetting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (goal?.status === 'generating') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-secondary/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32 animate-pulse delay-700" />

                <div className="relative z-10 flex flex-col items-center max-w-lg">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-2xl animate-spin" />
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>

                    <h1 className="text-3xl font-bold mb-4 tracking-tight">{t('building_roadmap_title')}</h1>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                        {t('building_roadmap_desc')} <span className="text-primary font-bold">{goal.exam}</span>.
                    </p>

                    <div className="flex items-center gap-3 bg-card border border-border px-5 py-3 rounded-full shadow-sm animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">{t('please_wait')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!goal) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                    <Target className="w-12 h-12 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('no_goal_set')}</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    {t('set_target_msg')}
                </p>
                <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity">
                    {t('go_dashboard')}
                </Link>
            </div>
        );
    }

    const daysRemaining = differenceInDays(new Date(goal.examDate), new Date());

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            {/* Header */}
            <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                            <img src="/prepmyexam.svg" alt="Logo" className="w-8 h-8" />
                            <span>PrepmyExam</span>
                        </Link>
                        <div className="h-6 w-px bg-border/50 hidden sm:block" />
                        <Link href="/" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group text-sm font-medium">
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            {t('back_dashboard')}
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href={`/user/${user?.uid}`} className="relative group">
                            <div className="w-10 h-10 rounded-full border-2 border-border overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-lg font-bold">
                                        {user?.displayName?.[0] || "U"}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative overflow-x-hidden">
                {/* Left Side - MATERIAL 3 DASHBOARD - FIXED */}
                <div className="fixed top-16 left-0 w-1/2 bottom-0 hidden md:flex flex-col bg-background z-10 border-r border-border/50 p-6 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-secondary/5 pointer-events-none" />

                    <div className="h-full flex flex-col gap-6 relative z-10 w-full pt-4">

                        {/* 1. HERO SECTION */}
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">{t('current_focus')}</span>
                                <h1 className="text-6xl font-black tracking-tighter text-foreground leading-[0.9]">
                                    {t('crack')} <span className="text-primary">{goal.exam}</span>
                                </h1>
                            </div>
                            <button
                                onClick={() => setShowResetModal(true)}
                                className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                title={t('reset_goal')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                        </div>

                        {/* 2. STATS WIDGET (Surface Container) */}
                        <div className="bg-secondary/30 rounded-[28px] p-8 flex items-center justify-between relative overflow-hidden group hover:bg-secondary/40 transition-colors">
                            <div className="relative z-10">
                                <div className="text-8xl font-black text-foreground tabular-nums tracking-tighter">
                                    {daysRemaining}
                                </div>
                                <div className="text-base font-bold text-muted-foreground mt-1 uppercase tracking-wider">{t('days_to_go')}</div>
                            </div>

                            <div className="h-20 w-px bg-foreground/10 mx-6" />

                            <div className="relative z-10 text-right">
                                <div className="text-3xl font-bold text-foreground">
                                    {new Date(goal.examDate).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">{t('target_date')}</div>
                            </div>
                        </div>

                        {/* 3. CALENDAR WIDGET */}
                        <div className="flex-1 bg-background border border-border/60 rounded-[28px] p-6 flex flex-col overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <CalendarSync goal={goal} onWeekSelect={handleWeekSelect} className="w-full h-full" />
                        </div>

                        {/* 4. ACTION BUTTON */}
                        <button className="w-full py-5 bg-foreground text-background font-bold text-base uppercase tracking-wider rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-all hover:scale-[1.01] shadow-lg active:scale-[0.99]">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span>{t('start_daily_task')}</span>
                        </button>

                    </div>
                </div>

                {/* Right Side - Scrollable Roadmap - PRESERVED EXACTLY */}
                <div className="md:ml-[50%] w-full md:w-1/2 min-h-[calc(100vh-64px)] p-6 md:p-12 scroll-smooth" id="roadmap-container">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between md:hidden">
                            {/* Mobile View Header for Goal */}
                            <h1 className="text-2xl font-bold">
                                {t('crack')} <span className="text-primary">{goal.exam}</span>
                            </h1>
                            <div className="text-sm font-bold bg-secondary px-3 py-1 rounded-lg">
                                {daysRemaining} Days
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-primary" /> {t('study_roadmap')}
                            </h2>
                        </div>

                        <div className="relative border-l-2 border-border ml-4 md:ml-8 space-y-12 pb-12">
                            {goal.roadmap?.map((week, index) => (
                                <div
                                    key={index}
                                    id={`week-card-${week.week}`}
                                    className="relative pl-8 md:pl-12 group transition-all duration-500 ease-out"
                                >
                                    {/* Connector Dot */}
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background transition-colors duration-300 ${index === 0 ? "bg-primary w-5 h-5 -left-[11px]" : "bg-muted-foreground/30 group-hover:bg-primary/50"
                                        }`} />

                                    <div className="space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                            <h3 className="text-xl font-bold text-foreground">{week.title}</h3>
                                            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded uppercase tracking-wider">
                                                {t('week')} {week.week}
                                            </span>
                                        </div>

                                        {week.description && (
                                            <p className="text-muted-foreground italic">{week.description}</p>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {week.topics?.map((topic, i) => (
                                                <div key={i} className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all flex items-start gap-3 group/item">
                                                    <div className="mt-1 w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors">
                                                        {/* Checkbox Placeholder */}
                                                    </div>
                                                    <span className="text-sm font-medium group-hover/item:text-foreground/80">{topic}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                        onClick={() => !resetting && setShowResetModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => !resetting && setShowResetModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{t('reset_goal_confirm_title')}</h3>
                                <p className="text-muted-foreground">
                                    {t('reset_goal_confirm_desc')}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    disabled={resetting}
                                    className="flex-1 py-3 rounded-xl font-bold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={confirmResetGoal}
                                    disabled={resetting}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {resetting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('resetting')}</span>
                                        </>
                                    ) : (
                                        t('yes_reset')
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

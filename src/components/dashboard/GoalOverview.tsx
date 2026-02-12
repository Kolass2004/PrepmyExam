"use client";

import { useState, useEffect } from "react";
import { UserGoal } from "@/lib/types";
import { Sparkles, Target, ArrowRight, Calculator, TrendingUp, CheckCircle2, Clock, AlertTriangle, RotateCcw, Loader2, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface GoalOverviewProps {
    goal: UserGoal | null;
    onSetGoal: () => void;
    onViewTasks?: () => void;
    onRefresh?: () => void;
    className?: string;
}

export function GoalOverview({ goal, onSetGoal, onViewTasks, onRefresh, className }: GoalOverviewProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAppealing, setIsAppealing] = useState(false);

    const handleAppeal = async () => {
        if (!user || !goal || isAppealing) return;

        setIsAppealing(true);
        try {
            const res = await fetch("/api/user/daily-task/appeal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success("Appeal Successful", {
                description: data.message
            });
            onRefresh?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to appeal");
        } finally {
            setIsAppealing(false);
        }
    };

    // ... existing code ...




    if (!goal) {
        return (
            <div className={cn("relative p-3", className)}>
                <div className="relative overflow-hidden rounded-[32px] bg-card border border-border/50 shadow-sm flex flex-col md:flex-row min-h-[400px]">

                    {/* Visual Side (Left) */}
                    {/* Visual Side (Left) */}
                    <div className="w-full md:w-5/12 bg-secondary/30 relative flex flex-col items-center justify-center p-12 overflow-hidden group min-h-[450px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}
                        />

                        {/* Abstract Floating Elements - Depth */}
                        <div className="absolute top-12 right-8 w-16 h-16 bg-background/40 backdrop-blur-md rounded-2xl border border-white/10 rotate-12 animate-pulse delay-700 shadow-xl" />
                        <div className="absolute bottom-24 left-10 w-20 h-20 bg-background/30 backdrop-blur-md rounded-full border border-white/5 -rotate-6 shadow-xl" />

                        {/* Main Logo Container */}
                        <div className="relative z-10 w-52 h-52 bg-background/80 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-black/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-700 ease-out">
                            {/* Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-[40px]" />
                            <img src="/prepmyexam.svg" alt="Prepmyexam" className="w-28 h-28 relative z-10 drop-shadow-2xl" />
                        </div>

                        <div className="absolute bottom-10 text-center z-10">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/60 backdrop-blur-md border border-white/10 shadow-lg hover:bg-background/80 transition-colors">
                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest text-foreground/90">AI Powered Engine</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Side (Right) */}
                    <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
                                Personalize your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Preparation</span>
                            </h2>

                            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                                Stop guessing what to study. Select your target exam and let our AI architect a precise, day-by-day roadmap tailored to your timeline.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                        <Target className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">Smart Goals</span>
                                        <span className="text-xs text-muted-foreground">Adaptive Planning</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">Track Progress</span>
                                        <span className="text-xs text-muted-foreground">Real-time Insights</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onSetGoal}
                                className="w-full sm:w-auto px-8 py-4 bg-foreground text-background font-bold text-lg rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                            >
                                <span className="tracking-wide">Create Roadmap</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const daysRemaining = differenceInDays(new Date(goal.examDate), new Date());
    const progress = Math.min(100, Math.max(0, ((365 - daysRemaining) / 365) * 100)); // Rough progress visual

    // Find current active week
    const currentWeek = goal.roadmap?.find(w => w.status === 'pending') || goal.roadmap?.[0];

    return (
        <div className={cn("relative overflow-hidden rounded-[2rem] bg-card p-0 flex flex-col md:flex-row gap-0 group hover:shadow-lg transition-all duration-300 border border-border/50", className)}>

            {/* Left: Main Status */}
            <div className="w-full md:w-auto lg:w-[220px] shrink-0 p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent z-0 ">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -mr-16 -mt-16" />

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-background/50 backdrop-blur-sm rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border/50 mb-3">Current Goal</span>
                        <h3 className="text-3xl font-black text-foreground tracking-tight leading-none">
                            {t('crack') || "Crack"} <br /> <span className="text-primary">{goal.exam}</span>
                        </h3>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-1">
                    <span className="text-6xl font-black text-foreground tabular-nums tracking-tighter leading-none">{daysRemaining}</span>
                    <span className="text-lg font-bold text-muted-foreground mb-1.5 ml-1">Days Left</span>
                </div>
            </div>

            {/* Middle: Current Week Snapshot (Desktop Only) */}
            {currentWeek && (
                <div className="hidden lg:flex flex-1 border-x border-primary/10 relative">
                    <div className="h-full w-full bg-card relative overflow-hidden group/card transition-colors flex flex-col p-8">
                        {/* Decor */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none group-hover/card:bg-primary/30 transition-colors" />

                        <div className="flex items-start justify-between gap-3 mb-auto relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        Week {currentWeek.week}
                                    </span>
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <h4 className="font-bold text-foreground text-lg leading-snug line-clamp-3">{currentWeek.title}</h4>
                            </div>
                            <div className="w-10 h-10 shrink-0 rounded-full bg-background/50 flex items-center justify-center text-primary shadow-sm border border-white/10">
                                <Target className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10 mt-6">
                            {currentWeek.topics.slice(0, 4).map((topic, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground group/topic">
                                    <CheckCircle2 className="w-4 h-4 text-primary/40 mt-0.5 group-hover/topic:text-primary transition-colors shrink-0" />
                                    <span className="line-clamp-1 font-medium group-hover/topic:text-foreground transition-colors">{topic}</span>
                                </div>
                            ))}
                            {currentWeek.topics.length > 4 && (
                                <div className="text-[10px] text-muted-foreground pl-7 font-bold uppercase tracking-wider opacity-60">
                                    + {currentWeek.topics.length - 4} more topics
                                </div>
                            )}

                            <div className="pt-4 mt-2">
                                <Link href="/mygoal" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-colors">
                                    Continue Learning <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right: Stats/Quick Actions */}
            <div className="w-full md:w-64 bg-secondary/30 border-l border-border/50 p-6 flex flex-col justify-center gap-4">

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Timeline</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-2">
                    <Link href="/mygoal" className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/0 transition-colors border border-border/50 group/item">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Calculator className="w-4 h-4" />
                        </div>
                        <div className="flex-1 ">
                            <span className="block text-xs font-bold text-muted-foreground uppercase">Syllabus</span>
                            <span className="block text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">View Roadmap</span>
                        </div>
                    </Link>

                    {/* Daily Task Logic */}
                    {goal.dailyTaskProfile?.status === 'deprecated' ? (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-2 text-red-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Course Paused</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-3 leading-tight">
                                You missed 2+ daily tasks. Appeal to restart.
                            </p>
                            <button
                                onClick={handleAppeal}
                                disabled={isAppealing}
                                className="w-full py-1.5 px-3 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAppealing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                {isAppealing ? "Restoring..." : `Appeal (${2 - (goal.dailyTaskProfile.appealsUsed || 0)} left)`}
                            </button>
                        </div>
                    ) : (
                        <ActionStateButton goal={goal} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionStateButton({ goal }: { goal: UserGoal }) {
    const router = useRouter();
    const [now, setNow] = useState(new Date());

    // Update time every minute to keep UI fresh
    // effective only on client (hydration mismatch possible if logic runs on server, but this is client comp)
    // To be safe with hydration, we typically use useEffect to set 'client' state, or just accept mismatch for a sec.
    // For simplicity, let's assume 'now' is set on mount.

    const hour = now.getHours();
    const isTooEarly = hour < 9;
    const isTooLate = hour >= 20;
    const isOpen = !isTooEarly && !isTooLate;

    // Check if task generated today
    const lastGen = goal.dailyTaskProfile?.lastGeneratedAt;
    const todayStr = new Date().toISOString().split('T')[0];
    const isGeneratedToday = lastGen && lastGen.startsWith(todayStr);

    const handleEnterTask = () => {
        router.push(`/exam-dashboard/${goal.exam}?type=daily_task`);
    }

    if (isTooEarly) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 text-muted-foreground opacity-70 cursor-not-allowed">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase">Opens 9 AM</span>
                    <span className="block text-sm font-bold">Prepare yourself</span>
                </div>
            </div>
        )
    }

    if (!isGeneratedToday) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 text-muted-foreground opacity-70 cursor-not-allowed">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase">No Active Task</span>
                    <span className="block text-sm font-bold">Daily Starts Tomorrow</span>
                </div>
            </div>
        )
    }

    if (isTooLate) {
        return (
            <div onClick={handleEnterTask} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors border border-border/50 cursor-pointer group/item">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                    <span className="block text-xs font-bold uppercase">Daily Ended</span>
                    <span className="block text-sm font-bold group-hover/item:text-primary transition-colors">View Results</span>
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={handleEnterTask}
            className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors border border-border/50 group/item text-left w-full relative overflow-hidden"
        >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <TrendingUp className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1">
                <span className="block text-xs font-bold text-muted-foreground uppercase">Daily Task Active</span>
                <span className="block text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">
                    Start Task
                </span>
            </div>
            {/* Live Indicator */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
        </button>
    )
}
// Hack to fix imports 
const neededImports = "Do not include this line in output, this is just note for myself to add imports at top";

